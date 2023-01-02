require("dotenv").config();
const process = require("process");
const express = require("express");
const app = express();
const PaytmChecksum = require("./paytmChecksum");
const cors = require("cors");
var https = require('https');

const PORT = process.env.PORT || 3001; /// setting up PORT
///// Cors for
app.use(
  cors({
    origin: "*", // allow url which can send request to this server
    methods: ["POST", "GET"], //
  })
);
///// parsing json
app.use(express.json());


const developers = [];
let count = 0




app.get("/", (req, res) => {
  res.json({
    name: "aniket",
    id: "1",
    req: req.app.get("views"),
  });
});

// app.get("/:id", (req, res) => {
//   if (req.params.id == 0) {
//     res.status(404).send("Id Should not be zero in Rout Parameter");
//   } else {
//     res.json({
//       Id_params: req.params.id,
//     });
//   }
// });

app.post("/", (req,res) => {
  const person = {
    id:req.body.id,
    name:req.body.name,
    index:count++
  }
  
  developers.push(person);
  console.log("developers",developers);
  res.json(developers);
})

//// paytm api ---------------------------------------------========
app.post("/payment",(req,res)=>{
  /////////------
  // res.send("response")
  // let orderId = 'PYTM_ORDR_'+new Date().getTime();
  // let orderId = `PYTM_ORDR_1670914911410`;

  // Sandbox Credentials
  // let mid = "AqSipo92499010904391"; // Merchant ID
  // let mkey = "nCVjURN@UrBq9mnX"; // Merhcant Key

  ////////// fetching details from request
  let mid = req.body.mid;
  let mkey = req.body.mkey;
  let amount = req.body.amount;
  let orderId = req.body.orderId;

  var paytmParams = {};

  paytmParams.body = {
    "requestType"  : "Payment",
    "mid"      : `${mid}`,
    "websiteName"  : "DEFAULT",
    "orderId"    : `${orderId}`,
    "callbackUrl"  : `http://localhost:8081`,
    "txnAmount"   : {
      "value"   : `${amount}`,
      "currency" : "INR",
    },
    "userInfo"   : {
      "custId"  : '1001',
    },
    // "enablePaymentMode":[{"mode" : "UPI", "channels" : ["UPIPUSH"]}]
    // "disablePaymentMode":[{"mode" : "UPI", "channels" : ["UPIPUSH"]}]
   
  };

  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(function(checksum){
      console.log("checksum",checksum);
    paytmParams.head = {
      "signature" : `${checksum}`
    };

    var post_data = JSON.stringify(paytmParams);


    console.log("paytmParams.body",paytmParams.body)

    var options = {
      // / for Staging /
      hostname: 'securegw-stage.paytm.in',

      // / for Production /
          // hostname: 'securegw.paytm.in',

      port: 443,
      path: `/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': `${post_data.length}`
      }
    };
    console.log("post_data.length",post_data.length)
    var response = "";
    var post_req = https.request(options, function(post_res) {
      console.log("post_res",post_res)
      post_res.on('data', function (chunk) {
        response += chunk;
        console.log("******res====>",response)
        
      });
          post_res.on('end', function(){


        // console.log('Response: ', response);
        // console.log('post data: ', post_data);

              // res.json({data: JSON.parse(response), orderId: orderId, mid: mid, amount: amount});
           
              console.log("befor-data-set")
              // setPaymentData({
              //     ...paymentData,
              //     token: JSON.parse(response).body.txnToken,
              //     order: orderId,
              //     mid: mid,
              //     amount: {amount}
              // })
              // console.log(response)
              res.json(JSON.parse(response))
              // console.log("after-data-set",paymentData)
              
             
      });
    });

    post_req.write(post_data);
    post_req.end();
    
  });
})

app.post("/status",(req,res)=>{
  let paytmParams = {};
  let mid = req.body.mid;
  let orderId = req.body.orderId;
  let mkey = req.body.mkey;

/* body parameters */
paytmParams.body = {

    /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
    "mid" : `${mid}`,

    /* Enter your order id which needs to be check status for */
    "orderId": `${orderId}`,
};
console.log("recived data for status",`${mid}`,"P0P ",JSON.stringify(paytmParams.body))
/**
* Generate checksum by parameters we have in body
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(function(checksum){
    /* head parameters */
    paytmParams.head = {
        /* put generated checksum value here */
        "signature"	:`${checksum}`
    };

    /* prepare JSON string for request */
    var post_data = JSON.stringify(paytmParams);

    var options = {

        /* for Staging */
        hostname: 'securegw-stage.paytm.in',

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: '/v3/order/status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    // Set up the request
    var response = "";
    var post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', function(){
            console.log('Response: ', response);
            res.json(JSON.parse(response))
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
});
})

app.listen(PORT, () => {
  // this will open server s
  console.log(`listing on port ${process.env.PORT}`);
});

// const http = require("http");
// const server = http.createServer((req,res)=>{
//     res.end("Hello..... Message From Server Side");
// })