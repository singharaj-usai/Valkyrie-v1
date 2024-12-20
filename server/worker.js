const amqp = require('amqplib');
const RCCService = require('./functions/api/utils/rccService');
const Asset = require('./functions/api/models/Asset');
const Game = require('./functions/api/models/Game');
const connectDB = require('./functions/api/config/database');

const MONGODB_URI = process.env.MONGODB_URI;

const rccService = new RCCService('http://128.254.193.148:8484');

async function consumeQueue() {
    const connection = await amqp.connect('amqp://valk:smoothcriminal@rabbitmq');
    const channel = await connection.createChannel();
    await channel.assertQueue('thumbnail_render_queue', { durable: true });

    try {
      console.log('Attempting to connect to MongoDB...');
      await connectDB(MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }

    console.log('Waiting for messages in the thumbnail render queue...');

    channel.consume('thumbnail_render_queue', async (message) => {
        const content = JSON.parse(message.content.toString());
        const assetId = content.assetId;
        const assetType = content.assetType;

        console.log(`Received assetId: ${assetId}. Rendering thumbnail...`);

        try {
            const renderedThumbnailUrl = await rccService.renderAssetThumbnail(assetId, assetType);

            // Update the asset in the MongoDB collection with the new thumbnail URL (improve later)
            if(assetType == 'Place') {
                await Asset.updateOne({ assetId: assetId }, { ThumbnailLocation: renderedThumbnailUrl });
                await Game.updateOne({ assetId: assetId }, { thumbnailUrl: renderedThumbnailUrl });
            } else {
                await Asset.updateOne({ assetId: assetId }, { ThumbnailLocation: renderedThumbnailUrl });
            }
            console.log(`Asset ${assetId} thumbnail updated with ${renderedThumbnailUrl}`);

        } catch (error) {
            console.error(`Failed to process asset ${assetId}:`, error);
        }

        // Acknowledge the message after processing
        channel.ack(message);
    }, { noAck: false });
}

// Start consuming messages from the queue
consumeQueue().catch(console.error);