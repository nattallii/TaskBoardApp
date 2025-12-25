import asyncio
import json
import aio_pika

from app.db.session import AsyncSessionLocal
from app.services.profile_service import create_profile_if_not_exists
from app.schemas.profile import ProfileCreate

RABBIT_URL = "amqp://guest:guest@rabbitmq/"

async def consume_profiles():
    print("Profile consumer started")

    while True:
        try:
            connection = await aio_pika.connect_robust(RABBIT_URL)
            channel = await connection.channel()

            queue = await channel.declare_queue(
                "profile.create",
                durable=True,
            )

            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process():
                        data = json.loads(message.body)

                        profile = ProfileCreate(
                            username=data["username"],
                            bio=data.get("bio"),
                        )

                        async with AsyncSessionLocal() as db:
                            await create_profile_if_not_exists(
                                db=db,
                                user_id=data["user_id"],
                                profile=profile,
                            )

                        print(f"Profile created for user_id={data['user_id']}")

        except Exception as e:
            print("Consumer error, retrying in 5s:", e)
            await asyncio.sleep(5)
