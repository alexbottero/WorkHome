
var AWS=require("aws-sdk");
AWS.config.update({
    region:"eu-west-1"
  });
  const docClient=new AWS.DynamoDB.DocumentClient();
  var seances=require('./user.json');


/**
 * Create a new user in the DB
 * @param {Id of the new user} usrId 
 */
  function createUser(usrId) {
    return new Promise((resolve,reject)=>{
      var params = {
        TableName:"User_WorkHome",
        Item:{
            "id_User": usrId,
            seances
           }
      };
    docClient.put(params, (err, data)=>{
      if (err) {
          reject(err);
      } else {
          resolve(params.Item);
        }
      });
    });
  }
  
/**
 * Find the user in the DB and return it, null if he doesn't exist
 * @param {Id of the user} idUser 
 */
  function readUser(idUser){
    return new Promise((resolve,reject)=>{
      var params={
        TableName:"User_WorkHome",
        Key:{
          "id_User":idUser
        }
      };
      docClient.get(params,(err,data)=>{
        if(err){
          reject(err);
          
          } else {
            if(Object.keys(data).length == 0) {
            resolve(undefined);
          } else {
            resolve(data.Item);}
        }
      });
    });
    
  }
  
  /**
   * Update the time value for a training
   * @param {Id of the user} idUser 
   * @param {Type of session} type 
   * @param {Time to add to each exercice} addTime 
   */
  function updateTimeExercise(idUser,type,addTime) {
    return new Promise((resolve,reject)=>{
      var params = {
        TableName:"User_WorkHome",
        Key:{
          "id_User":idUser
        },

        UpdateExpression: "set seances.#type.time_exercice = seances.#type.time_exercice +:val",
        ExpressionAttributeNames:{
          "#type":type
        },
        ExpressionAttributeValues:{
            
            ":val":addTime
        },
        ReturnValues:"UPDATED_NEW"
      };
      docClient.update(params, function(err, data) {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }
      });
    }) ;
  
  }
  module.exports={updateTimeExercise,createUser,readUser};