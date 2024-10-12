const axios = require('axios');

class RCCService {
    // Authorization required: Arbiter handles all requests to RCCService Instances.
    // Written By: Seven

    constructor(serviceUrl) {
        this.serviceUrl = serviceUrl;
    }

    function generateJobId() {
         const randomHex = (length) => {
             return [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
         };
         const jobId = `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${randomHex(4)}-${randomHex(12)}`;

         return jobId;
    }

    // Method: renderAssetThumbnail
    // args: assetId
    // Description: To be used after uploading a new asset or manually updating an asset through admin tools, arbiter converts and uploads thumbnail to an available bucket.
    // Returns: thumbnailUrl
    async renderAssetThumbnail(assetId, assetType) {
        try {
            const jobId = generateJobId();
            const response = await axios.post(this.serviceUrl, {
                    assetId: assetId,
                    assetType: assetType,
                    jobId: jobId,
                    accessKey: process.env.RCC_ACCESS_KEY
                });

             return response.data;
        } catch (error) {
            console.error(`Error rendering thumbnail for assetId ${assetId}:`, error);
            throw error;
        }
    }
}
