commitversion=`git log | head -1 | awk '{print $2}' | cut -c1-7`
commitdate=`git log | head -3 | tail -1 | sed -e 's/Date:   //'`

# Double quotation marks are used in the sed command to allow shell variable expansion
sed -i -e "s/VITE_APP_TITLE=.*/VITE_APP_TITLE=JMAP Demo $commitversion($commitdate)/" .env.demo
yarn build --mode demo
git checkout .env.demo > /dev/null 2>&1
