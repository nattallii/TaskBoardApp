import os
import aio_pika
from loguru import logger


class RabbitMQ:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        url = os.getenv("RABBITMQ_URL")

        if not url:
            raise RuntimeError("RABBITMQ_URL is not set")

        logger.info("Connecting to RabbitMQ")

        self.connection = await aio_pika.connect_robust(url)

        self.channel = await self.connection.channel()

        self.exchange = await self.channel.declare_exchange(
            name="user.events",
            type=aio_pika.ExchangeType.TOPIC,
            durable=True,
        )

        logger.info("RabbitMQ connected successfully")

    async def close(self):
        if self.connection:
            await self.connection.close()


rabbitmq = RabbitMQ()
