var AWS = require('aws-sdk');
var myDocumentClient = new AWS.DynamoDB.DocumentClient();

//*/ get reference to S3 client 
var s3 = new AWS.S3();

exports.handler = (event, context, callback) => {

    const userId = event.requestContext.authorizer.claims['cognito:username'];
    
    try {
        let results = doWork(userId);
        results.then((data) => {
            var response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(data),
            };
            console.log(response);
            callback(null, response);
        });
        
    } catch(e) {
        console.log(e);
        throw(e);
    }
};

async function doWork(userId) {
    var birds = await getPaths(userId);
    var images = await getImages(birds);
    var response = await createReponses(birds, images);
    return response;
}

async function getPaths(userId) {
    return new Promise((resolve, reject) => {
        var params = {
            TableName: "Classify",
            
            FilterExpression: "#userId = :userId",
            ExpressionAttributeNames: {
                "#userId":"userId"
            },
            ExpressionAttributeValues: {
                ":userId":userId
            }
        };
    
        myDocumentClient.scan(params, (err, data) => {
            if (err) {
                console.log("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                resolve(data);
            }
        });
    });
}

async function getImages(birds) {
    var images = [];
    
    birds.Items.forEach(i => {
        var src = getImage(i.path);
        images.push(src);
    });

    return images;
}

function getImage(filePath) {
    const params = {
      "Bucket": "deeplearning-test-bucket-birdception",
      "Key": filePath,
      "Expires": 600
    };
    
    var url =  s3.getSignedUrl('getObject', params);

    return url;
}

function createReponses(birds, images) {
    var results = [];
    
    birds.Items.forEach((bird, i) => {
        var out = {
                path: bird.path, 
                classification: bird.classification,
                url: images[i]
            };
            
        results.push(
            out
        );
    });
    
    return results;
}