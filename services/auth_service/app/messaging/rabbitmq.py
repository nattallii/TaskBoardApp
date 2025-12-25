import aio_pika

class RabbitMQ:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        self.connection = await aio_pika.connect("amqp://guest:guest@rabbitmq/")
        self.channel = self.connection.channel()
        self.exchange = self.channel.declare_exchange(

            name="user.events",
            type=aio_pika.ExchangeType.TOPIC,
            durable=True,
        )

    async def close(self):
        if self.connection:
            await self.connection.close()



rabbitmq = RabbitMQ()