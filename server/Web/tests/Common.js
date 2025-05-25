function SpeedTest(AFunc, ACount)
{
  var LStarted = new Date();

  for(var i = 0; i < ACount; i++)
    AFunc();

  alert(new Date() - LStarted);
}