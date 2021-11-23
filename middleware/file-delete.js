const aws = require('aws-sdk');
 
aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    secretKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
});
 
const s3 = new aws.S3();
 
const fileDelete = async (imagePath) => {
    const filename = imagePath.split('/').pop();
    const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: filename };
 
 
    s3.headObject(params)
        .promise()
        .then(
            (data) => {
                console.log('File Found in S3');
                s3.deleteObject(params)
                    .promise()
                    .then(
                        () => console.log('file deleted Successfully'),
                        //prettier-ignore
                        () => console.log('ERROR in file Deleting :' + JSON.stringify(err))
                    );
            },
            (err) => console.log('File not Found ERROR : ' + err.code)
        );
 
};
 
module.exports = fileDelete;