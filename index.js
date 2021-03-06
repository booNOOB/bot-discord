const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const configs = require('./config.json');
const google = require('googleapis');

const youtube = new google.youtube_v3.Youtube({
    version: 'v3',
    auth: configs.GOOGLE_KEY
});
const client = new Discord.Client();

const prefixo = configs.PREFIX;

const servidores = {
    'server': {
        connection: null,
        dispatcher: null,
        fila: [],
        estouTocando: false
    }
}

client.on("ready", () => {
    console.log("Estou online, papai!");
});

client.on("message", async (msg) => {

    //filtros

    if (!msg.guild) return;

    if (!msg.content.startsWith(prefixo)) return;

    if (!msg.member.voice.channel) {
        msg.channel.send('Você tem que estar em um canal de voz! ');
        return;
    }

    //comandos
    if (msg.content === prefixo + 'join') { // $join
        try {
            servidores.server.connection = await msg.member.voice.channel.join();
        } catch (err) {
            console.log('Erro ao entrar no canal de voz!');
            console.log(err);
        }
    }

    if (msg.content === prefixo + 'leave') { // $leave
        msg.member.voice.channel.leave();
        servidores.server.connection = null;
        servidores.server.dispatcher = null;
        servidores.server.estouTocando = false;
        servidores.server.fila = [];
    }

    if (msg.content.startsWith(prefixo + 'play')) { // $play <link>
        let oQueTocar = msg.content.slice(6);

        if (oQueTocar.length === 0) {
            msg.channel.send('Eu preciso do link ou do nome da música, burrão! ');
            return;
        }

        if (servidores.server.connection === null) {
            try {
            servidores.server.connection = await msg.member.voice.channel.join();
        } catch (err) {
            console.log('Erro ao entrar no canal de voz!');
            console.log(err);
        }
        }

        if (ytdl.validateURL(oQueTocar)) {
            servidores.server.fila.push(oQueTocar);
            console.log('Adicionado: ' + oQueTocar);
        }
        else {
            youtube.search.list({
                q: oQueTocar,
                part: 'snippet',
                fields: 'items(id(videoId),snippet(title))',
                type: 'video'
            }, function (err, resultado) {
                if (err) {
                    console.log(err);
                }
                if (resultado) {
                    const id = resultado.data.items[0].id.videoId;
                    oQueTocar = 'https://www.youtube.com/watch?v=' + id;
                    servidores.server.fila.push(oQueTocar);
                    console.log('Adicionado: ' + oQueTocar);
                }
                if (resultado) {
                    const videoId = resultado.data.items[0].id.videoId;
                    oQueTocar = 'https://youtube.com/playlist?list=' + id;
                    servidores.server.fila.push(oQueTocar);
                    console.log('Adicionado: ' + oQueTocar);
                }
            });
        }
        tocaMusicas();
    }

    if (msg.content === prefixo + 'stop') { // $stop
        servidores.server.dispatcher.pause();
    }

    if (msg.content === prefixo + 'resume') { // $resume
        servidores.server.dispatcher.resume();
    }
});


const tocaMusicas = () => {
    if (servidores.server.estouTocando === false) {
        const tocando = servidores.server.fila[0];
        servidores.server.estouTocando = true;
        servidores.server.dispatcher = servidores.server.connection.play(ytdl(tocando, configs.YTDL));
    
        servidores.server.dispatcher.on('finish', () => {
            servidores.server.fila.shift();
            servidores.server.estouTocando = false;
            if (servidores.server.fila.length > 0) {
                tocaMusicas();
            }
            else {
                servidores.server.dispatcher = null;
            }
        });
    }
}


client.login(configs.TOKEN_DISCORD);
