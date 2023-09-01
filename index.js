const functions = require('@google-cloud/functions-framework');
const {Storage} = require('@google-cloud/storage');
const { createHash } = require('node:crypto')

const storage = new Storage();
const VALIDITY_PERIOD = 10 * 60 * 1000 // 10 minutes
const VALIDITY_READ_VIDEO_PERIOD = 10 * 60 * 1000 // 10 minutes
const domains = process.env.CORS_DOMAINS.split(',');
const prefix = `images`

function sha256(content) {  
  return createHash('sha256').update(content).digest('hex')
}
function getAllowOrigin(requestOrigin) {
  if(!requestOrigin) {
    return domains[0]
  }
  if(requestOrigin.indexOf('http://localhost') === 0 || domains.indexOf(requestOrigin) >= 0) {
    return requestOrigin;
  }
  return domains[0];
}

functions.http('signUrl', async (req, res) => {
  const requestOrigin = req.get('origin');
  res.set('Access-Control-Allow-Origin', getAllowOrigin(requestOrigin));
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === "OPTIONS") {
    // stop preflight requests here
    res.status(204).send('');
    return;
  }
  const action = req.body.action;
  const fileName = req.body.fileName;
  let filePath;
  let options;
  let bucketName;
  if(action === 'read-video') {
    bucketName = process.env.VIDEO_BUCKET_NAME;
    console.log('Generating a read url for file', fileName, ' -> ', fileId, 'and type', fileType)
    filePath = `videos/${fileName}/${fileName}.webm`
    options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + VALIDITY_READ_VIDEO_PERIOD
    };
  } else {
    bucketName = process.env.BUCKET_NAME;
    const fileId = sha256(fileName);
    const fileType = req.body.fileType;
    filePath = `${prefix}/${fileId}`
    console.log('Generating a url for file', fileName, ' -> ', fileId, 'and type', fileType)
    options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + VALIDITY_PERIOD,
        contentType: fileType,
    };
  }

    // Get a v4 signed URL for uploading file
        
    storage.bucket(bucketName)
        .file(filePath)
        .getSignedUrl(options)
    .then(urls => {
        console.log('Generated PUT signed URL:');
        console.log(urls);
        res.send({status: 'ok', url: urls})
    })
    .catch(err => {
      console.error(err);
      res.status(500).send({status: 'ko'})
    });
});
