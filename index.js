const { Client, Util, MessageEmbed, Discord, } = require('discord.js')
const ytdl = require('ytdl-core')
const Youtube = require('simple-youtube-api')
const { Video } = require('simple-youtube-api')
const createBar = require("string-progressbar")
const Prefix = process.env.prefix
const { Utils } = require("erela.js")
const { stripIndents } = require("common-tags")

const client = new Client({ disableEveryone: true})
const youtube = new Youtube(process.env.youtubeApi)
const queue = new Map()

client.on('ready', () => console.log('Active'))
client.on('message', async message => {
 if(message.author.bot) return
 if(!message.content.startsWith(Prefix)) return
 const args = message.content.substring(Prefix.length).split(" ")
 const searchString = args.slice(1).join(' ')
 const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''
 const serverQueue = queue.get(message.guild.id)

 // ---------------------------------------------------------------------------------------------------- Public Commands
 if(message.content.startsWith(Prefix + `help`)) {
    message.channel.send('check DM')
    message.author.send('This is a music bot it\'s now in its working stage')
 }
 if(message.content.startsWith(Prefix + ".")) {
    message.reply('وش تبي تنقط فاضين لك')
    message.react('💙') }
 // ---------------------------------------------------------------------------------------------------- Public Commands
 // ---------------------------------------------------------------------------------------------------- music Commands
  if(message.content.startsWith(Prefix + `pause`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(!serverQueue.playing) return message.channel.send('The music is already paused')
    serverQueue.playing = false
    serverQueue.connection.dispatcher.pause()
    message.channel.send('The music is now paused')
    return undefined
 } else if(message.content.match(`${Prefix}p`, `${Prefix}play`)) {
    const voiceChannel = message.member.voice.channel
    if(!voiceChannel) return message.channel.send("You need to be in a voice channel to play music.")
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if(!permissions.has('CONNECT')) return message.channel.send("I don\'t have the permission to connect to the voice channel.")
    if(!permissions.has('SPEAK')) return message.channel.send("I don\'t have the permission to speak in the voice channel.")
    if(!args[1]) return message.channel.send('You need a song name or URL to play song')

    if(url.match("https://www.youtube.com/playlist")) {
        const playList = await youtube.getPlaylist(url)
        const videos = await playList.getVideos()
        for (const video of Object.values(videos)) {
            const video2 = await youtube.getVideoByID(video.id)
            await handleVideo(video2, message, voiceChannel, true)
        }
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

 } else if(message.content.startsWith(Prefix + `stop`)) {
    if(!message.member.voice.channel) return message.channel.send("You need to be in a voice channel to stop the bot.")
    if(!serverQueue) return message.channel.send('There\'s no music playing')
    serverQueue.songs = []
    serverQueue.connection.dispatcher.end()
    message.channel.send('i have stoped the music for you.')
    return undefined
 } else if(message.content.startsWith(Prefix + `s`, `skip`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to skip')
    if(!serverQueue) return message.channel.send('There is no music playing to skip')
    serverQueue.connection.dispatcher.end()
    message.channel.send('I have skipped the music for you')
    return undefined
 } else if(message.content.startsWith(Prefix + `v`, `volume`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(!args[1]) return message.channel.send(`The volume is: **${serverQueue.volume}%**`)
    if(isNaN(args[1])) return message.channel.send('This is not a valid amount to change the volume to')
    if(args[1] > 100) return message.channel.send('The number is above the max limit')
    serverQueue.volume = args[1]
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 100)
    message.channel.send(`I have changed the volume to ${args[1]}`)
    return undefined
 } else if(message.content.startsWith(Prefix + `np`)) {
    const serverQueue = queue.get(message.guild.id)
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    const sonG = serverQueue.songs[0]
    const minS = video.duration.minutes
    const secS = video.duration.seconds
    const seek = `${minS}:${secS}`
    let nowPlaying = new MessageEmbed()
      .setTitle("Now playing")
      .setDescription(`[${sonG.title}](${sonG.url})`)
      .setColor("#F8AA2A")
      .setAuthor("Now Playing ♪", 'https://rythm.fm/rythm.png')
      .addFields(
        { name: "Time: ", value: seek},
      )
      .setFooter(`Requested by: ${message.author.username}`)
      .setTimestamp()
    return message.channel.send(nowPlaying)
 } else if(message.content.startsWith(Prefix + `q`, `queue`)) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    message.channel.send(`
**Now playing:** ${serverQueue.songs[0].title}

__**Song queue:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
    `, { split: true })
    return undefined
 } else if(message.content.startsWith(Prefix + 'resume')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    if(serverQueue.playing) return message.channel.send('The music is not paused')
    serverQueue.playing = true
    serverQueue.connection.dispatcher.resume()
    message.channel.send('The music is playing now')
    return undefined
 } else if(message.content.startsWith(Prefix + 'loop')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    if(!serverQueue) return message.channel.send('There is no music playing')
    serverQueue.loop = !serverQueue.loop
    return message.channel.send(`${serverQueue.loop ? `**Enabled**` : `**Disabled**`} ☑️`)
 } else if(message.content.startsWith(Prefix + 'leave')) {
    if(!message.member.voice.channel) return message.channel.send('You need to be in a voice channel to use this command')
    serverQueue.voiceChannel.leave()
    return message.channel.send('Left ☑️')
 }
 // ---------------------------------------------------------------------------------------------------- music Commands
})

async function handleVideo(video, message, voiceChannel, playList = false) {
    const serverQueue = queue.get(message.guild.id)

    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        duration: video.duration,
    }

    if(!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true
        }
        queue.set(message.guild.id, queueConstruct)

        queueConstruct.songs.push(song)

     try {
        var connection = await voiceChannel.join()
        if (!client.voiceChannel) (message.channel.send(`Joined ${voiceChannel} and bound to ${message.channel}`))
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

    if(!song){
        queue.delete(guild.id)
        return
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
    .on('finish', () => {
        if(!serverQueue.loop) serverQueue.songs.shift()
        play(guild, serverQueue.songs[0])
    })
    .on('error', error => {
        console.log(error)
    })
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 100)

    if(!serverQueue.loop) {
        serverQueue.textChannel.send(`Started Playing: **${song.title}** `) 
        .then(message => {
            message.delete({ timeout: 5000 })
        })
        .catch(console.error)
    }
    
  }

client.login(process.env.TOKEN)