import InfluxDBService from './services/influxdb';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Configuration avec les variables d'environnement
const influxConfig = {
    url: process.env.INFLUXDB_URL || '',
    token: process.env.INFLUXDB_TOKEN || '',
    org: process.env.INFLUXDB_ORG || '',
    bucket: process.env.INFLUXDB_BUCKET || ''
};

// Vérification de la configuration
if (!influxConfig.url || !influxConfig.token || !influxConfig.org || !influxConfig.bucket) {
    throw new Error('Variables d\'environnement manquantes. Veuillez configurer le fichier .env');
}

// Création d'une instance du service
const influxService = new InfluxDBService(influxConfig);

// Exemple d'envoi de données
async function sendSensorData() {
    try {
        // Exemple de données de capteur
        const measurement = 'sensor_data';
        const tags = {
            location: 'building_1',
            sensor_id: 'temp_01'
        };
        const fields = {
            temperature: 23.5,
            humidity: 45.2,
            isActive: true
        };

        await influxService.writeData(measurement, tags, fields);
        console.log('Données envoyées avec succès');

        // Exemple de requête
        const query = `from(bucket: "${influxConfig.bucket}")
            |> range(start: -1h)
            |> filter(fn: (r) => r["_measurement"] == "sensor_data")`;
        
        const results = await influxService.queryData(query);
        console.log('Résultats de la requête:', results);

    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exécution de l'exemple
sendSensorData(); 