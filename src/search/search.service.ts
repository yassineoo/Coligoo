import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  constructor() {}
  /* async getAll(filter: SearchFilterDto) {
        const {startAge, endAge} = filter;
        let start: Date, end: Date;
        if(startAge && endAge) {
            start = new Date();
            end = new Date();
            start.setFullYear(start.getFullYear() - endAge);
            end.setFullYear(end.getFullYear() - startAge);
        }
        const [artisans, count] = await this.artisanRepository.findAndCount({
            where: {
                category: {
                    id: filter.categoryId ? filter.categoryId : undefined,
                },
                subCategories: {
                    id: filter.subCategoryId ? filter.subCategoryId : undefined,
                },
                city: {
                    id: filter.cityId ? filter.cityId : undefined,
                    wilaya: {
                        code: filter.wilayaCode ? filter.wilayaCode : undefined,
                    },
                },
                homeService: filter.homeService ? filter.homeService === 'true' : undefined,
                hasVehicule: filter.hasVehicule ? filter.hasVehicule === 'true' : undefined,
                artisanCardImgUrl: filter.hasArtisanCard ? filter.hasArtisanCard === 'true' ? Not(IsNull()) : IsNull() : undefined,
                paymentMethod: filter.paymentMethod ? Like(`%${filter.paymentMethod}%`) : undefined,
                perimetreDeTraveaux: filter.perimetreDeTraveaux ? Like(`%${filter.perimetreDeTraveaux}%`) : undefined,
                expYears: filter.expYears ? filter.expYears : undefined,
                // status: ArtisanStatus.ACTIF,
                isProfileVerified: true,
                user: {
                    sex: filter.sex ? filter.sex : undefined,
                    dob: startAge && endAge ? Between(start, end) : undefined,
                    blocked: false,
                }
            },
            skip: filter.pageSize * (filter.page - 1),
            take: filter.pageSize,
            order: {
                rating: {
                    rating: 'DESC'
                }
            },
            relations: ['user', 'category', 'rating'],
        });
        const returnedArtisans = artisans.map(artisan => {
            return {
                nom: artisan.user.nom,
                prenom: artisan.user.prenom,
                imgUrl: artisan.user.imgUrl,
                id: artisan.user.id,
                rating: artisan.rating?.rating,
                hasBadge: artisan.badgeStatus === BadgeStatus.ACTIF,
                category: artisan.category,
                longitude: artisan.longitude,
                latitude: artisan.latitude,
            }
        })
        return {artisans: returnedArtisans, count}
    }

    async getByName(filter: SearchQueryDto) {
        const {query} = filter;
        const [artisans, count] = await this.artisanRepository.findAndCount({
            where: [{
                user: {
                    nom: Like(`%${query}%`),
                    blocked: false,
                },
                isProfileVerified: true,
                // status: ArtisanStatus.ACTIF,
            }, {
                user: {
                    prenom: Like(`%${query}%`),
                    blocked: false,
                },
                isProfileVerified: true,
                // status: ArtisanStatus.ACTIF,
            }, {
                category: {
                    name: Like(`%${query}%`),
                },
                isProfileVerified: true,
                // status: ArtisanStatus.ACTIF,
            }, {
                category: {
                    ar_name: Like(`%${query}%`),
                },
                isProfileVerified: true,
                // status: ArtisanStatus.ACTIF,
            }, {
                subCategories: {
                    name: Like(`%${query}%`),
                },
                isProfileVerified: true,
                // status: ArtisanStatus.ACTIF,
            }, {
                subCategories: {
                    ar_name: Like(`%${query}%`),
                },
                isProfileVerified: true,
                // status: ArtisanStatus.ACTIF,
            }],
            skip: filter.pageSize * (filter.page - 1),
            take: filter.pageSize,
            order: {
                rating: {
                    rating: 'DESC'
                }
            },
            relations: ['user', 'category', 'rating'],
        });
        const returnedArtisans = artisans.map(artisan => {
            return {
                nom: artisan.user.nom,
                prenom: artisan.user.prenom,
                imgUrl: artisan.user.imgUrl,
                id: artisan.user.id,
                rating: artisan.rating?.rating,
                hasBadge: artisan.badgeStatus === BadgeStatus.ACTIF,
                category: artisan.category,
                longitude: artisan.longitude,
                latitude: artisan.latitude,
            }
        })
        return {artisans: returnedArtisans, count}
    }

    async getNearby(filter: SearchNearbyDto) {
        const {latitude, longitude, radius, startAge, endAge, query} = filter;
        let start: Date, end: Date;
        if(startAge && endAge) {
            start = new Date();
            end = new Date();
            start.setFullYear(start.getFullYear() - endAge);
            end.setFullYear(end.getFullYear() - startAge);
        }
        const queryObject : any = {
            category: {
                id: filter.categoryId ? filter.categoryId : undefined,
            },
            subCategories: {
                id: filter.subCategoryId ? filter.subCategoryId : undefined,
            },
            city: {
                id: filter.cityId ? filter.cityId : undefined,
                wilaya: {
                    code: filter.wilayaCode ? filter.wilayaCode : undefined,
                },
            },
            homeService: filter.homeService ? filter.homeService === 'true' : undefined,
            hasVehicule: filter.hasVehicule ? filter.hasVehicule === 'true' : undefined,
            artisanCardImgUrl: filter.hasArtisanCard ? filter.hasArtisanCard === 'true' ? Not(IsNull()) : IsNull() : undefined,
            paymentMethod: filter.paymentMethod ? Like(`%${filter.paymentMethod}%`) : undefined,
            perimetreDeTraveaux: filter.perimetreDeTraveaux ? Like(`%${filter.perimetreDeTraveaux}%`) : undefined,
            expYears: filter.expYears ? filter.expYears : undefined,
            user: {
                sex: filter.sex ? filter.sex : undefined,
                dob: startAge && endAge ? Between(start, end) : undefined,
                blocked: false,
            },
            latitude: Not(IsNull()),
            longitude: Not(IsNull()),
            // isProfileVerified: true,
            // status: ArtisanStatus.ACTIF,
        }
        // const nomQueryObject = {...queryObject};
        // const prenomQueryObject = {...queryObject};
        // const categoryQueryObject = {...queryObject};
        // const subCategoryQueryObject = {...queryObject};
        // nomQueryObject.user.nom = query ? Like(`%${query}%`) : undefined;
        // prenomQueryObject.user.prenom = query ? Like(`%${query}%`) : undefined;
        // categoryQueryObject.category.name = query ? Like(`%${query}%`) : undefined;
        // subCategoryQueryObject.subCategories.name = query ? Like(`%${query}%`) : undefined;
        const [artisans, count] = await this.artisanRepository.findAndCount({
            where: [
                {
                    ...queryObject,
                    user: {
                        sex: filter.sex ? filter.sex : undefined,
                        dob: startAge && endAge ? Between(start, end) : undefined,
                        blocked: false,
                        nom: query ? Like(`%${query}%`) : undefined,
                    }
                },
                {
                    ...queryObject,
                    user: {
                        sex: filter.sex ? filter.sex : undefined,
                        dob: startAge && endAge ? Between(start, end) : undefined,
                        blocked: false,
                        prenom: query ? Like(`%${query}%`) : undefined,
                    }
                },
                {
                    ...queryObject,
                    category: {
                        id: filter.categoryId ? filter.categoryId : undefined,
                        name: query ? Like(`%${query}%`) : undefined,
                    }
                },
                {
                    ...queryObject,
                    subCategories: {
                        id: filter.subCategoryId ? filter.subCategoryId : undefined,
                        name: query ? Like(`%${query}%`) : undefined,
                    }
                }
            ],
            order: {
                rating: {
                    rating: 'DESC'
                }
            },
            relations: ['user', 'category', 'rating'],
        });
        const nearbyArtisans = artisans.filter(artisan => {
            const distance = DistanceCalculator.getDistanceFromLatLonInKm(+latitude, +longitude, artisan.latitude, artisan.longitude);
            return distance <= +radius;
        });
        const returnedArtisans = nearbyArtisans.map(artisan => {
            return {
                nom: artisan.user.nom,
                prenom: artisan.user.prenom,
                imgUrl: artisan.user.imgUrl,
                id: artisan.user.id,
                rating: artisan.rating?.rating,
                hasBadge: artisan.badgeStatus === BadgeStatus.ACTIF,
                category: artisan.category,
                permietreDeTraveaux: artisan.perimetreDeTraveaux,
                longitude: artisan.longitude,
                latitude: artisan.latitude,
            }
        })
        return {artisans: returnedArtisans, count}
    }
    */
}
