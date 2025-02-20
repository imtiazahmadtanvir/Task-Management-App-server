require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;
const app = express();
const verifyToken = (req,res,next) => {
    const token =req.cookies?.token;
    if(!token){
        return res.status(401).send({ message : 'unathorized access'});
    }
    
    jwt.verify(token,ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).message({message: 'unathorized acess'})
        }
        req.use = decoded;
        next();

    } )

}

// Middleware
app.use(cookieParser());
//cookies
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://task-management-applicat-6e6b6.web.app',
        'https://task-management-application07.netlify.app'
    ],
    credentials: true
}));


app.post('/logout' ,(req,res)=>{
    res.clearCookie('token' ,{
        httpOnly:true,
        secure: false,
    })
})


app.use(express.json());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: "Something went wrong!" });
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u4xyo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        console.log("Connected to MongoDB!");

        

        //Auth Apis
     
        app.post('/jwt', async (req, res) => {
            try {
                const user = req.body;
        
                // Ensure user data exists and contains expected properties
                if (!user || !user.email) {
                    return res.status(400).json({ error: 'Invalid user data provided' });
                }
        
                // Generate the token
                const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '5h' });
        
                // Set the token in a secure cookie
                res.cookie('token', token, {
                    httpOnly: true,  // Prevent JavaScript access
                    secure: false, // Use secure cookies in production
                    sameSite: 'strict', // Mitigate CSRF attacks
                });
        
                res.status(200).json({ success: true, token });
            } catch (error) {
                console.error('JWT Error:', error);
                res.status(500).json({ error: 'Failed to generate token' });
            }
        });
        
        

        const database = client.db("JobTaskDB"); 
        const artifactsCollection = database.collection("artifacts"); 
        
        
        const likedCollection = database.collection("likeddata"); 
        

        //add liked data in likedCollection collection 

        // app.post("/add-liked-data", async (req, res) => {
        //     const likedData = req.body;
        //     console.log("Received liked data::", likedData);
        //     const result = await likedCollection.insertOne(likedData);
        //     res.send(result);
        // });

         //fetch all the data new in the database



     
        /**
         * Route: GET /artifacts/user/:email
         * Description: Fetch artifacts added by a specific user via email
         */


        /**
 * Route: PUT /artifacts/:id
 * Description: Update all fields of an artifact
 */
  

        /**
                * Route: DELETE /artifacts/:id
                * Description: Delete an artifact by its ID
                */
      



        /**
         * Route: PUT /artifacts/:id (Replace entire artifact)
         * Description: Replace the entire artifact document
         */






    } catch (error) {
        console.error("Connection error:", error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Simple CRUD is running");
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
