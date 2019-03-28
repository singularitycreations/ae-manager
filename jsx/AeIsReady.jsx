/* eslint-disable no-undef */
/* eslint-disable no-var */
{
  function AeIsReady() {
    var myFile = new File('/c/test/AeIsReady.json');
    if (myFile.open('w')) {
      myFile.encoding = 'UTF-8';
      //   myFile.write('I am ready!');
      myFile.close();
    } else {
      // $.writeln ('File not opened');
    }
  }

  AeIsReady();
}
