import * as Minio from 'minio';

export default new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: true,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
});
