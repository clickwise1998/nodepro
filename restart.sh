ps -ef |grep node| grep server.js |awk '{print $2}'|xargs kill -9 
rm nohup.out
nohup node server.js &

