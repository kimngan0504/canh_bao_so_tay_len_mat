import React, {useEffect, useRef} from 'react';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import {Howl} from 'howler';
import { initNotifications, notify } from '@mycv/f8-notification';

//const mobilenet = require('@tensorflow-models/mobilenet');
//const knnClassifier = require('@tensorflow-models/knn-classifier');
import * as mobilenet from'@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import './App.css';
import soundURL from './acsset/hey_sondn.mp3';

var sound = new Howl({
   src: [soundURL]
});


const NOT_TOUCH_LABEL = 'not_touch';
const TOUCHED_LABEL='touched';
const TRAINING_TIME = 50;
const TOUCHED_CONFIDENCE = 0.8;
function App() {
  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();

 const init = async() =>{
   console.log('init...');
    await setupCamera();
    console.log('setup camera succes');

     classifier.current = knnClassifier.create();
     mobilenetModule.current = await mobilenet.load();
  

    console.log('setup done');
    console.log('không chạm tay lên mặt và bấm train 1');
 }
 const setupCamera=() => {
    return new Promise((resolve,reject) =>{
        navigator.getUserMedia= navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
        if(navigator.getUserMedia){
          navigator.getUserMedia(
            {video: true},
            stream =>{
                video.current.srcObject = stream;
                video.current.addEventListener('loadeddata', resolve);
            },
            error => reject(error)
          );
        }
        else{
          reject();
        }

    });
 }

// 5s se train 50 lan
 const train = async label => {
  console.log(`[${label}] dang train cho may mat cua minh`);

  for(let i = 0 ; i < TRAINING_TIME; ++i){
    console.log(`Progress ${parseInt((i+1)/ TRAINING_TIME*100)}%`);

    await training(label);
  }

 }

// buoc 1 train cho may khuon mat khong cham tay
//b2 train cho may khon mat co cham tay
// buoc 3: lay hinh anh hien tai, phan tich va so sanh voi data da hoc truoc do
//==> neu matching voi data khuon mat bi cham tay thi canh bao

const training = label =>{
  return new Promise(async resolve =>{
    const embedding = mobilenetModule.current.infer(
      video.current,
      true
    );
    classifier.current.addExample(embedding,label);
    await sleep(100);
    resolve();
  });
}


const run = async () => {
  const embedding = mobilenetModule.current.infer(
    video.current,
    true
  );
  const result = await classifier.current.predictClass(embedding);

  console.log('label:' , result.label);
  console.log('Confidences:', result.confidences);

  if(result.label=== TOUCHED_LABEL && 
    result.confidences[result.label] > TOUCHED_CONFIDENCE){
       console.log('touched');
       sound.play();

    }
    else{ console.log('not touched')};
    await sleep(200);
    run();

}



 const sleep=(ms= 0) =>{
   return new Promise(resolve => setTimeout(resolve,ms))
 }



  useEffect(() =>{
     init();
     //clean up
     return () =>{

     }
  },[]);

  return (
    <div className="main">
      <video
      ref ={video}
      className ="video"
      autoPlay
      />
       <div className="control">
         <button className="btn" onClick={() => train(NOT_TOUCH_LABEL)} >Train 1</button>
         <button className="btn" onClick={() => train(TOUCHED_LABEL)}> Train 2</button>
         <button className="btn" onClick={() => run()}> Run</button>
          
          
       </div>

    </div>
  );
}

export default App;
