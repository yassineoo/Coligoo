import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateUsersToHubStructure1732356000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create hub table first
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`hub\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`address\` text NULL,
        \`latitude\` decimal(10,8) NULL,
        \`longitude\` decimal(11,8) NULL,
        \`admin_user_id\` int NOT NULL,
        \`city_id\` int NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_hub_admin_user\` FOREIGN KEY (\`admin_user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_hub_city\` FOREIGN KEY (\`city_id\`) REFERENCES \`city\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // 2. Migrate existing hub admins to hub table
    // Find all HUB_ADMIN users and create corresponding hub entries
    await queryRunner.query(`
      INSERT INTO \`hub\` (\`name\`, \`address\`, \`admin_user_id\`, \`city_id\`, \`isActive\`, \`createdAt\`)
      SELECT 
        CONCAT(COALESCE(u.fullName, CONCAT(u.nom, ' ', u.prenom)), ' Hub') as name,
        u.address,
        u.id as admin_user_id,
        u.cityId as city_id,
        1 as isActive,
        u.createdAt
      FROM \`user\` u
      WHERE u.role = 'HUB_ADMIN'
    `);

    // 3. Update HUB_EMPLOYEE users to reference the new hub table
    // Map hub_id (which was pointing to admin user) to the new hub.id
    await queryRunner.query(`
      UPDATE \`user\` u
      INNER JOIN \`hub\` h ON h.admin_user_id = u.hub_id
      SET u.hub_id = h.id
      WHERE u.role = 'HUB_EMPLOYEE' AND u.hub_id IS NOT NULL
    `);

    // 4. Clear hub_id for HUB_ADMIN users (they don't belong to a hub, they own one)
    await queryRunner.query(`
      UPDATE \`user\`
      SET hub_id = NULL
      WHERE role = 'HUB_ADMIN'
    `);

    // 5. Now add the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`user\`
      ADD CONSTRAINT \`FK_user_hub\` 
      FOREIGN KEY (\`hub_id\`) REFERENCES \`hub\`(\`id\`) 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 6. Remove address from user table (now it's only on hub)
    await queryRunner.query(`
      ALTER TABLE \`user\` DROP COLUMN \`address\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add address back to user
    await queryRunner.query(`
      ALTER TABLE \`user\` ADD \`address\` varchar(255) NULL
    `);

    // Remove foreign key
    await queryRunner.query(`
      ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_user_hub\`
    `);

    // Restore old hub_id structure (pointing to admin user)
    await queryRunner.query(`
      UPDATE \`user\` u
      INNER JOIN \`hub\` h ON h.id = u.hub_id
      SET u.hub_id = h.admin_user_id
      WHERE u.role = 'HUB_EMPLOYEE'
    `);

    // Drop hub table
    await queryRunner.query(`DROP TABLE IF EXISTS \`hub\``);
  }
}
