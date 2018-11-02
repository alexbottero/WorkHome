
var answers=require('./answers.json');
var bd=require('./bd_access.js');
var helpers=require('./helpers.js');


exports.handler = function(event,context){
try{
  var request=event.request;
  var session= event.session;
  if (!event.session.attributes){
    event.session.attributes={};
  }

  if (request.type=="LaunchRequest"){
    bd.readUser(event.context.System.user.userId).then(user=>{
      if(user!=null){
        handleLaunchRequest(context,user,session);
      }
      else{
        bd.createUser(event.context.System.user.userId).then(userCreate=>{

          handleLaunchRequest(context,userCreate,session);
        }).catch(err=>{
          console.log(err);
        })
      }
    }).catch(err=>{
      console.log(err)
    })

  }else if(request.type=="IntentRequest"){
      console.log(request.intent.name)
      if (request.intent.name=="TypeSessionIntent"){
        handleTypeSessionIntent(request,context,session);
      }
      else if(request.intent.name=="StartSessionIntent"){
        handleStartSessionIntent(request,context,session);
      }
      else if(request.intent.name=="MoreSessionIntent"){
        handleMoreSessionIntent(context,session);
      }
      else if(request.intent.name=="EndSessionIntent"){
        handleEndSessionIntent(context,session);
      }
      else if(request.intent.name=="UpdateSessionIntent"){
        handleUpdateSessionIntent(request,context,session);
      }
      else if(request.intent.name=="UnknownIntent"){
        handleUnknownIntent(context,session)
      }
      else if(request.intent.name=="AMAZON.HelpIntent"){
        handleHelpIntent(context,session)
      }
      else if(request.intent.name=="AMAZON.CancelIntent"||request.intent.name=="AMAZON.StopIntent"){
        handleStopIntent(context,session)
      }
  }
  else{
    let options={};
    options.speechText="Je n'ai pas reconnu ta demande.";
    buildResponse(options);
  }
}
catch(e){
  console.log(e)
}



/**
 * Handler call to handle the feed back of the user
 * @param {request did by the user} request 
 * @param {*} context 
 * @param {session in progress} session 
 */
  function handleUpdateSessionIntent(request,context,session){

    if(session.attributes.endSessionIntent){
      var options={};
      options.session=session;
      let feedBack=request.intent.slots.feedBack.value;
      let speech=helpers.randomSpeech(answers.updateTextSpeech);
      if(feedBack=="difficile"||feedBack=="compliqué"||feedBack=="dur"){
        if(session.attributes.exercicesSession.time_exercice<=16){
          options.speechText=speech[3];
          options.speechText+=" "+speech[4];
          options.endSession=true;
          context.succeed(buildResponse(options));
        }else{
            bd.updateTimeExercise(event.context.System.user.userId,session.attributes.typeSession,-2).then(user=>{
                options.speechText=speech[0]+" ";
                options.speechText+=speech[4];
                options.endSession=true;
                context.succeed(buildResponse(options));
              }).catch(err=>(console.log(err)))
            }
                
      }
      else if(feedBack=="simple"||feedBack=="facile"){
        if(session.attributes.exercicesSession.time_exercice>=22){
          options.speechText=speech[2];
          options.speechText+=" "+speech[4];
          options.endSession=true;
          context.succeed(buildResponse(options));
        }
          else{
            bd.updateTimeExercise(event.context.System.user.userId,session.attributes.typeSession,2).then(user=>{
              options.speechText=speech[1]+" ";
              options.speechText+=speech[4];
              options.endSession=true;
              context.succeed(buildResponse(options));;
              }).catch(err=>(console.log(err)))
            
          }

      }
      else{
        options.speechText="Merci pour le retour, parfait si la séance convient. Ce fût une bonne session";
        options.endSession=true;
        context.succeed(buildResponse(options))
      } 
    }
    else{
      handleUnknownIntent(context,session)
    }
  }


  /**
 * Handler call at the end of the training
 * @param {*} context 
 */
function handleEndSessionIntent(context){
  if(session.attributes.startSessionIntent){
    var options={};
    options.session=session;
    options.speechText=helpers.randomSpeech(answers.endTextSpeech);
    options.session.attributes.endSessionIntent=true;
    options.session.attributes.startSessionIntent=false;
    options.endSession=false;
    context.succeed(buildResponse(options));
  }
  else{
    handleUnknownIntent(context,session)
  }
}
    
/**
 * Handler call to do the training again
 * @param {*} context 
 * @param {session in progress} session 
 */
  function handleMoreSessionIntent(context,session){
    var options={};
    options.session=session;
      if(session.attributes.startSessionIntent){
          options.speechText=session.attributes.speechText;
          options.endSession=false;
          context.succeed(buildResponse(options));
      }
      else{
        handleUnknownIntent(context,session)
      }
  }

/**
 * Handler to start the training session
 * @param {request did by the user} request 
 * @param {*} context 
 * @param {session in progress} session 
 */
  function handleStartSessionIntent(request,context,session){
    var options={};
    options.session=session;
    if(session.attributes.typeSessionIntent){
      options.speechText=" ";
      var compt=0;
      let speech=helpers.randomSpeech(answers.exerciceTextSpeech);
      session.attributes.exercicesSession.exercices.forEach(element => {  
        options.speechText+=speech[compt]+element+".<audio src=\""+helpers.selectTimeExercice(session.attributes.exercicesSession.time_Exercice)+"\"/>"+ speech[4]+" ";
        compt++;
      })
          options.speechText+=speech[5];
          options.session.attributes.startSessionIntent=true;
          options.session.attributes.typeSessionIntent=false;
          options.session.attributes.speechText=options.speechText;
          options.endSession=false;
          context.succeed(buildResponse(options));
    }
    else{
      handleUnknownIntent(context,session)
    }
  }

/**
 * Handler to get the type of training
 * @param {request did by the user} request 
 * @param {*} context 
 * @param {session in progress} session 
 */
  function handleTypeSessionIntent(request,context,session){
    var options={};
    options.session=session;
    if(session.attributes.launchIntent){
      let type=request.intent.slots.typeSession.value;
      if(type=="abdos"||type=="haut du corps"||type=="bas du corps"){
      
        let speech=helpers.randomSpeech(answers.typeTextSpeech);
        let exercices=session.attributes.user.seances[type].exercices;
        options.speechText =  speech[0]+" "+type+", "+speech[1];
        exercices.forEach(element => {
        options.speechText+="<p> "+element+" </p>";
        });
        options.speechText+=speech[2];
        options.session.attributes.exercicesSession=session.attributes.user.seances[type];
        options.session.attributes.typeSessionIntent=true;
        options.session.attributes.launchIntent=false;
        options.session.attributes.typeSession=type;
        options.endSession=false;
        context.succeed(buildResponse(options));
      
      }
      else{
        options.speechText="Il faut que tu précises quel type de séance tu veux faire. Par exemple, séance abdos";
        options.endSession=false;
        context.succeed(buildResponse(options));
      }
    }
    else{
      handleUnknownIntent(context,session)
    }
      
      
  }
/**
 * Handler to launch the session 
 * @param {*} context 
 * @param {user informations} user 
 * @param {session in progress} session 
 */
  function handleLaunchRequest(context,user,session) {
    var options = {};
    options.session=session;
    options.speechText =helpers.randomSpeech(answers.launchTextSpeech);
    options.repromptText = "Tu peux par exemple choisir de travailler les abdos";
    options.session.attributes.user=user;
    options.session.attributes.launchIntent=true;
    options.endSession = false;
    context.succeed(buildResponse(options));
  }

  /**
   * Handler to react for a bad input
   * @param {*} context 
   * @param {current session} session 
   */
  function handleUnknownIntent(context,session){
    var options={}
    options.session=session;
    if(session.attributes.launchIntent){
      options.speechText =helpers.randomSpeech(answers.unknownTextSpeech.type);
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else if(session.attributes.typeSessionIntent){
      options.speechText =helpers.randomSpeech(answers.unknownTextSpeech.start);
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else if(session.attributes.startSessionIntent){
      options.speechText =helpers.randomSpeech(answers.unknownTextSpeech.end);
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else if(session.attributes.endSessionIntent){
      options.speechText =helpers.randomSpeech(answers.unknownTextSpeech.update);
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else{
      options.speechText ="Je suis désolée je ne comprends pas votre demande.";
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
  }
/**
 * Handle to help the user if he's lost 
 * @param {*} context 
 * @param {current session} session 
 */
  function handleHelpIntent(context,session){
    var options={}
    options.session=session;
    if(session.attributes.launchIntent){
      options.speechText = "vous pouvez par exemple dire: session abdos pour lancer un entrainement d'abdos.";
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else if(session.attributes.typeSessionIntent){
      options.speechText =" Pour lancer la session dites simplement: lance session.";
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else if(session.attributes.startSessionIntent){
      options.speechText = "Vous pouvez choisir de recommencer en disant: encore une séance ou terminer la séance en disant: j'ai terminé.";
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else if(session.attributes.endSessionIntent){
      options.speechText ="Vous pouvez juger votre séance comme difficile ou facile pour que je puisse l'adapter.";
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
    else{
      options.speechText ="Je suis désolée je ne comprends pas votre demande.";
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
  }
  /**
   * handle the Stop and cancel Indent
   * @param {current context} context 
   * @param {*} session 
   */
  function handleStopIntent(context,session){
    var options={}
    options.session=session;
    options.speechText="Tu nous quittes déjà? Merci, d'avoir utiliser ce skill."
    options.endSession = true;
    context.succeed(buildResponse(options))
  }

  function buildResponse(options){
    var response ={
      version:"1.0",
      response:{
        outputSpeech: {
          type: "SSML",
          ssml: "<speak>"+options.speechText+"</speak>"
        },
        shouldEndSession:options.endSession
      }
    };
    if (options.repromptText){
      response.response.reprompt={
        outputSpeech: {
          type: "SSML",
          ssml: "<speak>"+options.repromptText+"</speak>"
        }
      };
    }
    if(options.session && options.session.attributes){
      response.sessionAttributes=options.session.attributes;
    }

    return response;
  }


};