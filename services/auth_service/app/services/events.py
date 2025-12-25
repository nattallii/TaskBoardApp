import json
import aio_pika

from app.core.config import settings

RABBITMQ_URL = settings.RABBITMQ_URL

EXCHANGE_NAME = "auth.events"
QUEUE_NAME = "profile.create"
ROUTING_KEY = "profile.create"


async def publish_profile_create_event(
    user_id: int,
    username: str,
    bio: str | None = None,
):
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()

    exchange = await channel.declare_exchange(
        EXCHANGE_NAME,
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )

    queue = await channel.declare_queue(
        QUEUE_NAME,
        durable=True,
    )

    await queue.bind(exchange, ROUTING_KEY)

    payload = {
        "user_id": user_id,
        "username": username,
        "bio": bio,
    }

    message = aio_pika.Message(
        body=json.dumps(payload).encode(),
        content_type="application/json",
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
    )

    await exchange.publish(message, routing_key=ROUTING_KEY)

    await connection.close()
