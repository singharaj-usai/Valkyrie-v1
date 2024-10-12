const amqp = require('amqplib');
const RCCService = require('./functions/api/utils/rccService');
const Asset = require('./functions/api/models/Asset');

const rccService = new RCCService('http://128.254.193.148:8484');

async function consumeQueue() {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    await channel.assertQueue('thumbnail_render_queue', { durable: true });

    console.log('Waiting for messages in the thumbnail render queue...');

    channel.consume('thumbnail_render_queue', async (message) => {
        const content = JSON.parse(message.content.toString());
        const assetId = content.assetId;
        const assetType = content.assetType;

        console.log(`Received assetId: ${assetId}. Rendering thumbnail...`);

        try {
            const renderedThumbnailUrl = await rccService.renderThumbnail(assetId);

            // Update the asset in the MongoDB collection with the new thumbnail URL
            await Asset.updateOne({ assetId: assetId }, { ThumbnailLocation: renderedThumbnailUrl });
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
