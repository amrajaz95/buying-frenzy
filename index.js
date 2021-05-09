const db = require('./db')
const express = require("express");
const app = express();
const router = express.Router();
// const routes = require("./routes/_routes")(router);
const port = process.env.PORT || 3000;

const allowCrossDomain = function (req, res, next) {
    res.header(
        "Access-Control-Allow-Origin",
        "*"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "POST",
        "GET"
    );
    next();
};

app.use(express.json());
app.use(allowCrossDomain);
// app.use("/", routes);

// Apis
// Search for restaurant by name api
app.get("/getRestsByName", async (req, res) => {

    try {
        let dbResponse = await db.db.collection('restaurants').find({ $text: { $search: req.query.name } }).toArray();
        let obj = {}
        if(dbResponse.length === 0) {
            obj.Result = "Sorry, no restaurants found";
        } else {
            obj.Result = dbResponse;
        }
              
        res.status(200).json(obj);
    } catch (e) {
        res.status(400).send({
            "message": e
        });
    }
});

app.post("/transaction", async (req, res) => {
    try {
        
        await db.db.collection('users').updateOne({
            "id": req.body.id
        },{
            $inc: {
                "cashBalance": -req.body.transactionAmount
            },
            $push: {
                "purchaseHistory" :{
                    "dishName": req.body.dishName,
                    "restaurantName": req.body.restaurantName,
                    "transactionAmount": req.body.transactionAmount,
                    "transactionDate": req.body.transactionDate
                }                
            }
        }) 
        await db.db.collection('restaurants').updateOne({
            "restaurantName": req.body.restaurantName
        },{
            $inc: {
                "cashBalance": req.body.transactionAmount
            }   
        })
res.status(200).json("Transaction Successful")

    } catch (e) {
        res.status(400).send({
            "message": e
        });
    }

})

// For listing top restaurants within a price range
app.get("/getRestsWithinPriceRange", async (req, res) => {

    try {
        let priceRange = req.query.priceRange.split("-")
        let dbResponse = await db.db.collection('restaurants').aggregate([
            {
                $project: {
                    restaurantName: 1,
                    items: {
                        $filter: {
                            input: "$menu",
                            as: "menu",
                            cond: {
                                $and: [
                                    {
                                        $gte: [
                                            "$$menu.price",
                                            parseInt(priceRange[0])
                                        ]
                                    },
                                    {
                                        $lte: [
                                            "$$menu.price",
                                            parseInt(priceRange[1])
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]).toArray()
        let i;
        let count = 0;
        let resObj = {};
        let flag = parseInt(req.query.flag);
        resObj.Results = [];
        if(flag === 0){
            for(i=0;i<dbResponse.length;i++) {
                let obj = {};
                if(count === parseInt(req.query.y)) {
                    break;
                }
                if(dbResponse[i].items.length > 0 && dbResponse[i].items.length < parseInt(req.query.x)) {
                    obj.restaurantName = dbResponse[i].restaurantName;
                    obj.id = dbResponse[i]._id;
                    resObj.Results.push(obj);
                }
                count++;
            }
        } else {
            for(i=0;i<dbResponse.length;i++) {
                let obj = {};
                if(count === parseInt(req.query.y)) {
                    break;
                }
                if(dbResponse[i].items.length > 0 && dbResponse[i].items.length > parseInt(req.query.x)) {
                    obj.restaurantName = dbResponse[i].restaurantName;
                    obj.id = dbResponse[i]._id;
                    resObj.Results.push(obj);
                }
                count++;
            }
        }
            
        res.status(200).json(resObj);
    } catch (e) {
        res.status(400).send({
            "message": e
        });
    }
});

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})
