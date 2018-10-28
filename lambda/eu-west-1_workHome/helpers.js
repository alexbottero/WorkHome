

function selectTimeExercice(time){
    switch(time){
      case 16: 
        res="https://s3-eu-west-1.amazonaws.com/workhomealexa/silence-16-sec.mp3"
        break;
      case 18:
        res="https://s3-eu-west-1.amazonaws.com/workhomealexa/silence-18-sec.mp3"
        break;
      case 20:
      res="https://s3-eu-west-1.amazonaws.com/workhomealexa/silence-20-sec.mp3"
      break;
      case 22:
        res="https://s3-eu-west-1.amazonaws.com/workhomealexa/silence-22-sec.mp3"
        break;
      default:
        res="https://s3-eu-west-1.amazonaws.com/workhomealexa/silence-22-sec.mp3"
    }
    return res
  }

  function randomSpeech(json){

    values=json;
    randomValue = values[parseInt(Math.random() * values.length)]
    return randomValue
  }

  module.exports={selectTimeExercice,randomSpeech}
