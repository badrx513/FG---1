const { Client, Util, MessageEmbed, MessageAttachment, } = require('discord.js')
const ytdl = require('ytdl-core')
const Youtube = require('simple-youtube-api')
const { Video, Playlist } = require('simple-youtube-api')
const createBar = require("string-progressbar")
const Prefix = process.env.prefix
const { Utils } = require("erela.js")
const client = new Client({ disableEveryone: true})
const youtube = new Youtube(process.env.youtubeApi)
const queue = new Map()
const STAY_TIME = process.env.StayTime

client.on('ready', () => {
console.log('bot is Active')
client.user.setStatus('streaming')
client.user.setActivity(`-help and -play`, { type: 'STREAMING' })
})
client.on('message', async message => {
 if(!message.guild) return
 if(message.author.bot) return
 if(!message.content.startsWith(Prefix)) return
 const args = message.content.substring(Prefix.length).split(" ")
 const searchString = args.slice(1).join(' ')
 const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''
 const serverQueue = queue.get(message.guild.id)
    
 // ---------------------------------------------------------------------------------------------------- Public Commands
 if(message.content.startsWith(Prefix + `help`)) {
    message.channel.send('check DM')
    let help = new MessageEmbed()
      .setAuthor("This is a list of the commands", 'https://rythm.fm/rythm.png')
      .setTitle("Commands")
      .setColor("#F8AA2A")
      .addFields(
          {name: '`play - p`', value: 'use play - p and a valid video URL'},
          {name: '`pause`', value: 'use this to pause the current song playing'},
          {name: '`stop`', value: 'use this to stop the bot from playing music'},
          {name: '`s - fs`', value: 'use this command to skip the current song'},
          {name: '`volume`', value: 'use this to adjust the volume of the bot'},
          {name: '`np`', value: 'use this to see the progress of the current song'},
          {name: '`queue`', value:'use this command to see all the song in the list'},
          {name: '`resume`', value: 'use this to resume the current song'},
          {name: '`leave`', value: 'use this command to make the bot leave the VC'},
          {name: '`loop`', value: 'use this command to make the current song loop'},
          {name: '`ql`', value: 'use this command to make all the list loop'},
          {name: 'To invite the bot', value: `[Click here](https://discord.com/api/oauth2/authorize?client_id=823689086547263509&permissions=2214068032&scope=bot)`}
      )
      .setTimestamp()
      .setFooter(`${message.author.username}`)
      return message.author.send(help)
 }
 // ---------------------------------------------------------------------------------------------------- Public Commands
 // ---------------------------------------------------------------------------------------------------- music Commands
 
  if(message.content.match(Prefix + `pause`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(!serverQueue.playing) return message.channel.send('The music is already paused')
    serverQueue.playing = false
    serverQueue.connection.dispatcher.pause()
    message.channel.send('The music is now paused')
    return undefined
 } else if(message.content.startsWith(`${Prefix}p`, `${Prefix}play`)) {
    const voiceChannel = message.member.voice.channel
    if(!voiceChannel) return message.channel.send("You need to be in a voice channel to play music.")
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if(!permissions.has('CONNECT')) return message.channel.send("I don\'t have the permission to connect to the voice channel.")
    if(!permissions.has('SPEAK')) return message.channel.send("I don\'t have the permission to speak in the voice channel.")
    if(!args[1]) return message.channel.send('You need a song name or URL to play song')

    if(url.match(/^.*(youtube\/|list=)([^#\&\?]*).*/gi)) {
        const playList = await youtube.getPlaylist(url)
        const videos = await playList.getVideos()
        for (const video of Object.values(videos)) {
            const video2 = await youtube.getVideoByID(video.id)
            await handleVideo(video2, message, voiceChannel, true)
        }
        return message.channel.send(`:white_check_mark: **\`${playList.title}\`** has been added!`);
    } else {
            try{
        var video = await youtube.getVideoByID(url)
     } catch {
        try {
            var videos = await youtube.searchVideos(searchString, 1)
            var video = await youtube.getVideoByID(videos[0].id)
        } catch {
            return message.channel.send('I couldn\'t find any search results')
        }
      }
      return handleVideo(video, message, voiceChannel)
    }

 } else if(message.content.match(Prefix + `stop`)) {
    if(!message.member.voice.channel) return message.channel.send("You need to be in a voice channel to stop the bot.")
    if(!serverQueue) return message.channel.send('There\'s no music playing')
    serverQueue.songs = []
    serverQueue.connection.dispatcher.end()
    message.channel.send('i have stoped the music for you.')
    return undefined
 } else if(message.content.match(Prefix + 's', 'fs')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to skip')
    if(!serverQueue) return message.channel.send('There is no music playing to skip')
    serverQueue.connection.dispatcher.end()
    message.channel.send('I have skipped the music for you')
    return undefined
 } else if(message.content.startsWith(Prefix + `volume`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(!args[1]) return message.channel.send(`The volume is: **${serverQueue.volume}%**`)
    if(isNaN(args[1])) return message.channel.send('This is not a valid amount to change the volume to')
    if(args[1] > 100) return message.channel.send('The number is above the max limit')
    serverQueue.volume = args[1]
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 100)
    message.channel.send(`I have changed the volume to ${args[1]}`)
    return undefined
 } else if(message.content.match(Prefix + `np`)) {
    const serverQueue = queue.get(message.guild.id)
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    const sonG = serverQueue.songs[0]
    const d = serverQueue.connection.dispatcher.streamTime / 1000
    const t = (d * Math.floor * 1)
      let nowPlaying = new MessageEmbed()
      .setTitle("Now playing")
      .setDescription(`[${sonG.title}](${sonG.url})`)
      .setColor("#F8AA2A")
      .setAuthor("Now Playing ♪", 'https://rythm.fm/rythm.png')
      .addFields(
        { name: "Time: ", value: `${t} / Full Time`},
      )
      .setFooter(`Requested by: ${message.author.username}`)
      .setTimestamp()
      return message.channel.send(nowPlaying)
 } else if(message.content.match(Prefix + `queue`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    const sonG0 = serverQueue.songs[0]
    let QueueServer = new MessageEmbed()
    .setTitle(`**Server queue** - ${message.guild.name}`)
    .setDescription(`\nCurrent: \n**${sonG0.title}**\n\nNext:\n` + (serverQueue.songs.map((song, i) => {
        return `**${i + 1}** - ${song.title} | (requested by : ${message.author.username})`
    }).slice(0, 5).join('\n\n') + 
    `\n\n${serverQueue.songs.length > 5 ? `And **${serverQueue.songs.length - 5}** other songs...` : `In the playlist **${serverQueue.songs.length}** song(s)...`} | Loop: ${serverQueue.loop ? `☑️` : `❎`} | QLoop: ${serverQueue.QL ? `☑️` : `❎`}`))
    .setFooter(`Requested by: ${message.author.username}`, message.author.displayAvatarURL())
    .setColor("#450000")
    .setTimestamp()
    return message.channel.send(QueueServer)

 } else if(message.content.match(Prefix + 'resume')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(serverQueue.playing) return message.channel.send('The music is not paused')
    serverQueue.playing = true
    serverQueue.connection.dispatcher.resume()
    message.channel.send('The music is playing now')
    return undefined
 } else if(message.content.match(Prefix + 'leave')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    serverQueue.voiceChannel.leave()
    return message.channel.send('Left ☑️')
 } else if(message.content.match(Prefix + 'loop')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(serverQueue.QL) serverQueue.QL = false
    serverQueue.loop = !serverQueue.loop
    return message.channel.send(`${serverQueue.loop ? `**Enabled** ☑️` : `**Disabled** ❎`}`)
 } else if(message.content.match(Prefix + 'ql')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(serverQueue.loop) !serverQueue.loop
    serverQueue.QL = !serverQueue.QL
    return message.channel.send(`${serverQueue.QL ? `**Enabled** ☑️` : `**Disabled** ❎`}`)
 }
 // ---------------------------------------------------------------------------------------------------- music Commands
})

async function handleVideo(video, message, voiceChannel, playList = false) {
    const serverQueue = queue.get(message.guild.id)

    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
    }

    if(!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true,
            QL: false,
        }
        queue.set(message.guild.id, queueConstruct)

        queueConstruct.songs.push(song)

        try {
            var connection = await voiceChannel.join().then(message.channel.send(`**👍Joined** ${voiceChannel} **and bound to** ${message.channel}`))
            queueConstruct.connection = connection
            play(message.guild, queueConstruct.songs[0])
         } catch (error) {
            console.log(`There was an error connecting to the voice channel: ${error}`)
            queue.delete(message.guild.id)
            return message.channel.send('There was an error connecting to the voice channel')
         }
        } else {
            serverQueue.songs.push(song)
            if(playList) return undefined
            else return message.channel.send(`**${song.title}** has been added to the queue`)
        }
        return undefined
    }

function play(guild, song) {
    const serverQueue = queue.get(guild.id)

    if (!song) {
        setTimeout(function () {
          if (serverQueue.connection.dispatcher && message.guild.me.voice.channel) return
          serverQueue.voiceChannel.leave()
          serverQueue.textChannel.send("💤 Leaving voice channel...")
        }, STAY_TIME * 1000)
        serverQueue.textChannel.send("").catch(console.error)
        return queue.delete(guild.id)
    }

    serverQueue.connection.on("disconnect", () => queue.delete(guild.id))

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
    .on('finish', () => { 
        if (serverQueue.QL) {
            let lastSong = serverQueue.songs.shift()
            serverQueue.songs.push(lastSong)
          } else if(!serverQueue.loop) {
            serverQueue.songs.shift()
          }
        play(guild, serverQueue.songs[0])
    })
    .on('error', error => {
        console.log(error)
    })
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 100)

    if(!serverQueue.QL) { 
        if(!serverQueue.loop) {
        serverQueue.textChannel.send(`Playing🎶 **${song.title}**`)
        }
    }
}

client.login(process.env.TOKEN)