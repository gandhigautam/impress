#!/bin/bash
yum -y update
yum -y install wget mc
yum -y install psmisc
yum -y groupinstall "Development Tools"
cd /usr/src
wget https://nodejs.org/dist/v8.2.1/node-v8.2.1.tar.gz
tar zxf node-v8.2.1.tar.gz
rm -f ./node-v8.2.1.tar.gz
cd node-v8.2.1
./configure
make
make install
cd ~
rm -rf /usr/src/node-v8.2.1
ln -s /usr/local/bin/node /bin
ln -s /usr/local/bin/npm /bin
sudo mkdir /ias
cd /ias
sudo npm install nodemailer websocket geoip-lite
sudo npm install impress --unsafe-perm
