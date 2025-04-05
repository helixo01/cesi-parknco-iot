import { InfluxDB, Point } from '@influxdata/influxdb-client'

// Configuration InfluxDB Cloud
interface InfluxDBConfig {
    url: string;
    token: string;
    org: string;
    bucket: string;
}

class InfluxDBService {
    private client: InfluxDB;
    private org: string;
    private bucket: string;

    constructor(config: InfluxDBConfig) {
        this.client = new InfluxDB({ url: config.url, token: config.token });
        this.org = config.org;
        this.bucket = config.bucket;
    }

    async writeData(measurement: string, tags: Record<string, string>, fields: Record<string, number | string | boolean>) {
        const writeApi = this.client.getWriteApi(this.org, this.bucket);
        
        const point = new Point(measurement);
        
        // Ajout des tags
        Object.entries(tags).forEach(([key, value]) => {
            point.tag(key, value);
        });

        // Ajout des champs
        Object.entries(fields).forEach(([key, value]) => {
            if (typeof value === 'number') {
                point.floatField(key, value);
            } else if (typeof value === 'boolean') {
                point.booleanField(key, value);
            } else {
                point.stringField(key, value);
            }
        });

        try {
            writeApi.writePoint(point);
            await writeApi.close();
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'écriture des données:', error);
            throw error;
        }
    }

    async queryData(fluxQuery: string) {
        const queryApi = this.client.getQueryApi(this.org);
        
        try {
            return await queryApi.collectRows(fluxQuery);
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
            throw error;
        }
    }
}

export default InfluxDBService; 