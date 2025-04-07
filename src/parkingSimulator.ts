import InfluxDBService from './services/influxdb';
import dotenv from 'dotenv';
import { Point } from '@influxdata/influxdb-client';

// Chargement des variables d'environnement
dotenv.config();

interface ParkingConfig {
    name: string;
    totalSpaces: number;
    types: {
        [key: string]: number;
    };
}

interface ParkingState {
    occupationRate: number;
    occupied: number;
}

const parkings: ParkingConfig[] = [
    {
        name: "CESI_INTERIEUR",
        totalSpaces: 50,
        types: {
            normal: 42,
            handicape: 3,
            electrique: 5
        }
    },
    {
        name: "PARKING_ETUDIANT",
        totalSpaces: 200,
        types: {
            normal: 200
        }
    }
];

class ParkingSimulator {
    private influxService: InfluxDBService;
    private previousStates: Map<string, Map<string, ParkingState>>;
    private maxVariationPerMinute: number = 0.01; // Maximum 1% de variation par minute

    constructor() {
        const influxConfig = {
            url: process.env.INFLUXDB_URL || '',
            token: process.env.INFLUXDB_TOKEN || '',
            org: process.env.INFLUXDB_ORG || '',
            bucket: process.env.INFLUXDB_BUCKET || ''
        };

        if (!influxConfig.url || !influxConfig.token || !influxConfig.org || !influxConfig.bucket) {
            throw new Error('Variables d\'environnement manquantes');
        }

        this.influxService = new InfluxDBService(influxConfig);
        this.previousStates = new Map();

        // Initialisation des états précédents
        parkings.forEach(parking => {
            const typeMap = new Map<string, ParkingState>();
            Object.entries(parking.types).forEach(([type, maxSpaces]) => {
                typeMap.set(type, {
                    occupationRate: 0,
                    occupied: 0
                });
            });
            this.previousStates.set(parking.name, typeMap);
        });
    }

    private getCurrentHour(): number {
        // Création d'une date avec le fuseau horaire de Paris
        const now = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});
        const parisDate = new Date(now);
        return parisDate.getHours() + (parisDate.getMinutes() / 60);
    }

    private isWeekend(): boolean {
        // Vérification du weekend selon l'heure de Paris
        const now = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});
        const parisDate = new Date(now);
        return parisDate.getDay() === 0 || parisDate.getDay() === 6;
    }

    private getTargetOccupationRate(hour: number): number {
        if (this.isWeekend()) {
            return 0.02;
        }

        if (hour < 7.5 || hour >= 18) {
            return 0.02;
        }

        if (hour >= 7.5 && hour < 9) {
            return (hour - 7.5) / 1.5;
        } else if (hour >= 11.75 && hour < 12.5) {
            return 0.7;
        } else if (hour >= 12.5 && hour < 13.5) {
            return 0.9;
        } else if (hour >= 16.5 && hour < 18) {
            return 0.5 - ((hour - 16.5) / 3);
        } else if (hour >= 9 && hour < 16.5) {
            return 0.9;
        }

        return 0.02;
    }

    private calculateNewOccupationRate(currentRate: number, targetRate: number, isNightOrWeekend: boolean): number {
        const maxChange = isNightOrWeekend ? 0.001 : this.maxVariationPerMinute; // 0.1% la nuit et weekend, 1% en journée
        
        if (Math.abs(targetRate - currentRate) <= maxChange) {
            return targetRate;
        }

        if (targetRate > currentRate) {
            return currentRate + maxChange;
        } else {
            return currentRate - maxChange;
        }
    }

    private async updateParkingState() {
        const hour = this.getCurrentHour();
        // Utilisation de l'heure de Paris pour l'affichage
        const now = new Date().toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
            dateStyle: "full",
            timeStyle: "long"
        });

        console.log('\n=== Mise à jour du ' + now + ' ===');
        console.log(`Période: ${this.isWeekend() ? 'Weekend' : 'Semaine'}`);

        for (const parking of parkings) {
            const targetOccupationRate = this.getTargetOccupationRate(hour);
            const previousStateMap = this.previousStates.get(parking.name)!;

            console.log(`\n${parking.name}:`);

            for (const [type, maxSpaces] of Object.entries(parking.types)) {
                const previousState = previousStateMap.get(type)!;
                
                // Calcul du nouveau taux d'occupation avec variation limitée
                const newOccupationRate = this.calculateNewOccupationRate(
                    previousState.occupationRate,
                    targetOccupationRate,
                    this.isWeekend() || (hour < 7.5 || hour >= 18)
                );

                // Calcul du nombre de places occupées
                const occupied = Math.round(maxSpaces * newOccupationRate);

                // Mise à jour de l'état précédent
                previousState.occupationRate = newOccupationRate;
                previousState.occupied = occupied;

                // Affichage des données
                console.log(`  Type: ${type}`);
                console.log(`    Places totales: ${maxSpaces}`);
                console.log(`    Places occupées: ${occupied}`);
                console.log(`    Places disponibles: ${maxSpaces - occupied}`);
                console.log(`    Taux d'occupation: ${(newOccupationRate * 100).toFixed(1)}%`);

                // Envoi des données à InfluxDB
                await this.influxService.writeData(
                    'parking_occupation',
                    {
                        parking_name: parking.name,
                        space_type: type,
                        is_weekend: this.isWeekend().toString()
                    },
                    {
                        occupied_spaces: occupied,
                        available_spaces: maxSpaces - occupied,
                        total_spaces: maxSpaces,
                        occupation_rate: newOccupationRate
                    }
                );
            }
        }
        console.log('\n=== Données envoyées avec succès ===\n');
    }

    public async start() {
        console.log('=== Démarrage de la simulation des parkings ===');
        console.log('Les données seront mises à jour toutes les minutes.');
        console.log('Variation maximale: ±1% par minute en semaine, ±0.1% la nuit et le weekend');
        console.log('Appuyez sur Ctrl+C pour arrêter la simulation.\n');
        
        // Mise à jour toutes les minutes
        setInterval(async () => {
            try {
                await this.updateParkingState();
            } catch (error) {
                console.error('\nErreur lors de la mise à jour:', error);
            }
        }, 60000);

        // Première mise à jour immédiate
        await this.updateParkingState();
    }
}

// Démarrage de la simulation
const simulator = new ParkingSimulator();
simulator.start().catch(console.error); 