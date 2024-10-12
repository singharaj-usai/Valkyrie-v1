const amqp = require('amqplib');

class ThumbnailQueue {
    constructor(queueName) {
        this.queueName = queueName;
    }

    // Function to initialize connection and channel to RabbitMQ
    async _connect() {
        if (!this.connection) {
            this.connection = await amqp.connect('amqp://rabbitmq');
        }
        if (!this.channel) {
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.queueName, { durable: true });
        }
        return this.channel;
    }

    // Function to publish a message (assetId) to the queue
    async addToQueue(assetId, assetType) {
        try {
            const channel = await this._connect();
            const message = { assetId, assetType };

            // Publish the assetId to the queue
            channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
            console.log(`Added assetId ${assetId} to thumbnail render queue.`);
        } catch (error) {
            console.error('Error adding to thumbnail queue:', error);
        }
    }

    // Function to close the connection (optional cleanup)
    async closeConnection() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
}

module.exports = new ThumbnailQueue('thumbnail_render_queue');
