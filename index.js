import Client from 'ssh2-sftp-client';
import { existsSync, mkdirSync, writeFile, createWriteStream, rm } from 'fs';
import { createInterface } from 'readline';
let sftp = new Client();
import chalk from 'chalk';
import path from 'path';

//Fill these in
//SFTP Only!;
const host = ""
const port = "";
const username = "";
const password = "";


function download(){
    sftp.connect({host: host,port: port,username: username,password: password}).then(() => {
        // will return an array of objects with information about all files in the remote folder
        if (!existsSync('./ftp/commands')){
            mkdirSync('./ftp/commands', { recursive: true });
        }
        return sftp.list('/commands/');
    }).then(async (data) => {
        // data is the array of objects
        let len = data.length;
        // x is one element of the array
        await data.forEach(x => {
            let remoteFilePath = '/commands/' + x.name;
            sftp.get(remoteFilePath).then((stream) => {
                // save to local folder ftp
                let file = './ftp/commands/' + x.name;
                writeFile(file, stream, (err) => {if (err) console.log(err);});
            });
        });
    }).then(()=>{
        sftp.get('lang.json', createWriteStream('./ftp/lang.json'));
        sftp.get('joke-ban.txt', createWriteStream('./ftp/joke-ban.txt'));
        sftp.get('config.json', createWriteStream('./ftp/config.json'));
        sftp.get('cmdchannelbypass.txt', createWriteStream('./ftp/cmdchannelbypass.txt'));
        sftp.get('banned-users.txt', createWriteStream('./ftp/banned-users.txt'));
        return sftp.get('index.js', createWriteStream('./ftp/index.js'));
    }).then(()=>{
        setTimeout(() => {console.log(chalk.green("Downloaded FTP!"));}, 1000);
        setTimeout(() => {process.exit();}, 10000);
    }).catch((err) => {console.log(err, 'catch error');});
}

async function upload() {
    try {
        await sftp.connect({host: host,port: port,username: username,password: password}).catch((err) => {return console.log(err, 'catch error');});
        sftp.on('upload', info => {console.log(`Uploaded ${info.source}`);});
        let rslt = await sftp.uploadDir(`./ftp`, `./`);
        return rslt;
    } finally {
        setTimeout(() => {sftp.end();}, 10000);
    }
}

function runProcess(query){

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        if(ans.toLocaleLowerCase() == "download"){
            rl.close();
            resolve(ans);
            return download();
        } else if (ans.toLocaleLowerCase() == "upload"){
            rl.close();
            resolve(ans);
            return upload().then(msg => {console.log(chalk.green("Uploaded FTP!"));}).catch(err => {console.log(`main error: ${err.message}`);});
        } else if (ans.toLocaleLowerCase() == "clear"){
            rm('./ftp/', { recursive: true }, (err) => {
                if (err) {throw err;}
                mkdirSync('./ftp');
                setTimeout(() => {resolve(ans);}, 4000);
                setTimeout(() => {rl.close();}, 5000);
                return console.log(chalk.green(`\nFTP was cleared!`));
            });
        } else {
            setTimeout(() => {rl.close();}, 5000);
            resolve(ans);
            return console.log(chalk.red("Invalid Input!"));
        }
    }))
}
console.clear();
console.log(chalk.blue("What would you like to do?\n\nOptions are:\nDownload, Upload, Clear"));
const ans = runProcess(chalk.green(" > "));
