var LRate;
var LPrevTxt;
function Speak(ATxt, event)
{
  if(event)
    event.preventDefault();

  var msg = new SpeechSynthesisUtterance(ATxt/* + ' ' + ATxt*/);
  //msg.voiceURI = 'Google US English Female';
  //msg.pitch = 0.8; //0 to 2
  if(LPrevTxt == ATxt)
    LRate = LRate === 1 ? 0.4 : 1;
  else
    LRate = 1;
  LPrevTxt = ATxt;
  msg.rate = LRate;
  msg.lang = 'en-US';
  msg.voice = USVoiceGet();
  window.speechSynthesis.speak(msg);
}

function VoiceNameLog(AName)
{
  if(!document.body)
    return;
  var LHE = document.createElement('div');
  LHE.innerHTML = '<b>used voice name</b>: ' + AName;
  document.body.appendChild(LHE);
}

var fUSVoice;
function USVoiceGet()
{
  if(fUSVoice)
    return fUSVoice;

  var LVoices = window.speechSynthesis.getVoices();
  var LUSVoices = [];
  VoiceNameLog(LVoices.length);
  for(var i = 0; i < LVoices.length; i++)
  {
    var voice = LVoices[i];
    console.log(voice.name, voice.default ? voice.default : '');
    if((voice.name.indexOf('US English') != -1) || (voice.name.indexOf('English United States') != -1))
    {
      fUSVoice = voice;
      LUSVoices.push(voice.name);
    }
    else
    if(!fUSVoice && voice.default)
      fUSVoice = voice;
  };
/*  if(LUSVoices.length == 0)
    alert('failed to find US English voice');
  else*/
  if(LUSVoices.length > 1)
    alert('found more than one US English voice:\n' + LUSVoices.join('\n'));

  VoiceNameLog(fUSVoice ? fUSVoice.name : '???');

  return fUSVoice;
}
USVoiceGet();

/*
var msg = new SpeechSynthesisUtterance('what is your name');

//msg.voiceURI = 'Google US English Female';
msg.volume = 1; // 0 to 1
msg.rate = 1; // 0.1 to 10
msg.pitch = 0.8; //0 to 2
//msg.text = 'Hello World';
msg.lang = 'en-US';
window.speechSynthesis.speak(msg);
msg.lang = 'en-GB';
window.speechSynthesis.speak(msg);
*/