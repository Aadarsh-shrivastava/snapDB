from fastapi import FastAPI, HTTPException, Body, Path
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from typing import List, Union
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import datetime

app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# client = MongoClient("mongodb://localhost:27017/")
# db = client["snapDB"]
# collection = db["sheet1"]


class DataItem(BaseModel):
    column_name: str
    value: int


class Entity(BaseModel):
    label: str
    name: str
    children: List["Entity"] = []
    data: Union[List[DataItem], int]

    # client = MongoClient("mongodb://localhost:27017/")

    # db = client["snapDB"]


client = MongoClient("mongodb://localhost:27017/")
db = client["snapDB"]


@app.get("/all_entities", response_model=List[Entity])
async def get_all_entities():
    collection = db["sheet1"]
    entities = list(collection.find())
    return entities


@app.get("/get_entity/{name}", response_model=List[Entity])
async def get_all_entities(name: str):
    collection = db[name]
    # print(name, collection)
    entities = list(collection.find())
    return entities


@app.get("/list_collections")
async def get_all_collections():
    try:
        # Get a list of all collection names
        collection_names = db.list_collection_names()

        return {"collections_info": collection_names}

    except Exception as e:
        return {"error": str(e)}


@app.post("/add_entity/{schemaName}")
async def add_entity(
    entity: Entity,
    schemaName: str = Path(..., title="The name of the collection to delete"),
):
    current_time = datetime.datetime.now().strftime("%Y%m%d%H%M")
    if not schemaName or schemaName == "":
        collection_name = f"collection_{entity.name.replace(' ', '_')}_{current_time}"
    else:
        collection_name = schemaName

    # Re-establish the MongoDB connection for each request

    # Create a new collection or use an existing one
    collection = db[collection_name]

    # Insert the entity into the collection
    result = collection.insert_one(jsonable_encoder(entity))

    # Close the MongoDB connection
    # client.close()

    return JSONResponse(content=jsonable_encoder(entity), status_code=201)


@app.delete("/delete_collection/{collection_name}")
async def delete_collection(
    collection_name: str = Path(..., title="The name of the collection to delete")
):
    try:
        # Check if the collection exists
        if collection_name not in db.list_collection_names():
            raise HTTPException(
                status_code=404, detail=f"Collection '{collection_name}' not found"
            )

        # Drop the collection
        db[collection_name].drop()

        return {"message": f"Collection '{collection_name}' deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from typing import List


@app.post("/replace_entities/{collection_name}")
async def replace_entities(
    new_entities: List[Entity],
    collection_name: str = Path(
        ..., title="The name of the collection to replace entities"
    ),
):
    try:
        # Check if the collection exists
        print(collection_name)
        if collection_name not in db.list_collection_names():
            raise HTTPException(
                status_code=404, detail=f"Collection '{collection_name}' not found"
            )

        # Clear existing documents in the collection
        db[collection_name].delete_many({})

        # Insert the new entities into the collection
        result = db[collection_name].insert_many(
            jsonable_encoder(entity) for entity in new_entities
        )

        return {
            "message": f"{result.inserted_ids} entities replaced in collection '{collection_name}' successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
