const { Client, MessageEmbed} = require ("discord.js");
const client = new Client();
const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const queue = new Map();
const https = require('https')
const url = 'https://www.reddit.com/r/dankmemes/hot/.json?limit=100'
const math = require('mathjs')
const got = require('got');
const token = "your-token";

client.on("ready", () => {
    console.log(`El bot ${client.user.tag} se a conectado correctamente.`)
    client.user.setActivity(`p/help 🐶 ${client.guilds.cache.size} Servers 🐶`, { type: 'WATCHING' });
});

client.on("message", message => {
  if (message.content === "p/help") {
    message.channel.send({embed: {
      author: {
        name: "Pug Bot Commands",
        icon_url: "https://66.media.tumblr.com/0c62b2ff3d8089ce04f90d3a98ad727b/tumblr_o2ucug3FTq1tga488o1_500.png"
      },
      fields: [{
          name: "😂 Fun",
          value: "``p/pug`` ``p/meme`` ``p/slap``"
        },
        {
          name: "🔧 Moderation",
          value: "``p/ban`` ``p/kick`` ``p/warn(Coming Soon)``"
        },
        {
          name: "🎵 Music",
          value: "``p/play`` ``p/skip`` ``p/stop``"
        },
        {
          name: "🎈 Misc",
          value: "``p/ping``"
        },
        {
          name: "📃 Official Discord",
          value: "``p/discord``"
        },
        {
          name: "🎉 Invite of the bot",
          value: "``p/invite``"
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: "https://66.media.tumblr.com/0c62b2ff3d8089ce04f90d3a98ad727b/tumblr_o2ucug3FTq1tga488o1_500.png",
        text: "© Pug Bot"
      }
    }
  });
  }
  
  
if(message.content === "p/invite") {
const embed = new MessageEmbed()
    .setTitle('https://discord.com/api/oauth2/authorize?client_id=729853064244363274&permissions=8&scope=bot')
    .setAuthor('Invite the bot to our server', "https://66.media.tumblr.com/0c62b2ff3d8089ce04f90d3a98ad727b/tumblr_o2ucug3FTq1tga488o1_500.png")  
message.channel.send(embed);    
}

if(message.content === "p/discord") {
const embed = new MessageEmbed()
    .setTitle("https://discord.gg/RczqUpQ")
    .setAuthor("Oficial Discord Server", "https://66.media.tumblr.com/0c62b2ff3d8089ce04f90d3a98ad727b/tumblr_o2ucug3FTq1tga488o1_500.png")
message.channel.send(embed);      
}
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } 
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.on('message', message => {
  if (!message.guild) return;

  if (message.content.startsWith('p/kick')) {
    const user = message.mentions.users.first();
    if (user) {
      const member = message.guild.member(user);
      if (member) {
        member
          .kick('Optional reason that will display in the audit logs')
          .then(() => {
            message.channel.send(`${user.tag} was kicked by:`);
            message.reply('.');
          })
          .catch(err => {
            message.reply('I was unable to kick the member.');
            console.error(err);
          });
      } else {
        message.reply("That user isn't in this server.");
      }
    } else {
      message.reply("You need mention a user to kick.");
    }
  }
});

client.on('message', message => {
  if (!message.guild) return;

  if (message.content.startsWith('p/ban')) {
    const user = message.mentions.users.first();
    if (user) {
      const member = message.guild.member(user);
      if (member) {
        member
          .ban({
            reason: 'They were bad!',
          })
          .then(() => {
            message.channel.send(`${user.tag} was banned by:`);
            message.reply('.');
          })
          .catch(err => {
            message.reply('I was unable to ban the member.');
            console.error(err);
          });
      } else {
        message.reply("That user isn't in this server.");
      }
    } else {
      message.reply("You need to mention a user to ban.");
    }
  }
});

client.on('message', message => {
  if (message.content === "p/ping") {
  message.channel.send('Pinging...')
    .then(m => {
      m.edit(`Pong! \`${m.createdTimestamp - message.createdTimestamp}\`ms`)
    })
  }    
});

client.on('message', message => {
  if (message.content === "p/meme") {
  const embed = new MessageEmbed();
  got('https://www.reddit.com/r/memes/random/.json').then(response => {
      let content = JSON.parse(response.body);
      let permalink = content[0].data.children[0].data.permalink;
      let memeUrl = `https://reddit.com${permalink}`;
      let memeImage = content[0].data.children[0].data.url;
      let memeTitle = content[0].data.children[0].data.title;
      let memeUpvotes = content[0].data.children[0].data.ups;
      let memeDownvotes = content[0].data.children[0].data.downs;
      let memeNumComments = content[0].data.children[0].data.num_comments;
      embed.addField(`${memeTitle}`, `[View thread](${memeUrl})`);
      embed.setImage(memeImage);
      embed.setFooter(`👍 ${memeUpvotes} 👎 ${memeDownvotes} 💬 ${memeNumComments}`);
      message.channel.send(embed)
          .then(sent => console.log(`Sent a reply to ${sent.author.username}`))
      console.log('Bot responded with: ' + memeImage);
  }).catch(console.error);
}
});

client.on('message', message => {
  if (message.content === "p/pug") {
  const embed = new MessageEmbed();
  got('https://www.reddit.com/r/pugs/random/.json').then(response => {
      let pugcontent = JSON.parse(response.body);
      let pugImage = pugcontent[0].data.children[0].data.url;
      let pugUpvotes = pugcontent[0].data.children[0].data.ups;
      let pugDownvotes = pugcontent[0].data.children[0].data.downs;
      let pugNumComments = pugcontent[0].data.children[0].data.num_comments;
      embed.setImage(pugImage);
      embed.setFooter(`👍 ${pugUpvotes} 👎 ${pugDownvotes}`);
      message.channel.send(embed)
      message.reactions.add('👍')
          .then(sent => console.log(`Sent a reply to ${sent.author.username}`))
      console.log('Bot responded with: ' + pugImage);
  }).catch(console.error);
}
});

client.on ('message', message => {
  if (message.content.startsWith("p/slap")) {
  let slaps = ['https://thumbs.gfycat.com/PersonalUnlinedAsiaticwildass-size_restricted.gif', 'https://i.gifer.com/Xhts.gif', 'https://media1.tenor.com/images/b6d8a83eb652a30b95e87cf96a21e007/tenor.gif?itemid=10426943', 'https://media.tenor.com/images/47698b115e4185036e95111f81baab45/tenor.gif'];
  let slapr = slaps[Math.floor(Math.random() * slaps.length)];
  let personslap = message.mentions.members.first();
  let quote = ['Oof', 'Ouch', 'That hurt', 'Wow', 'LOL', 'Yeet'];
  let quoter = quote[Math.floor(Math.random() * quote.length)];

  if (!personslap) {
      let personslap = 'nobody';

      let embed = new MessageEmbed()
          .setDescription(`**<@${message.author.id}> just slapped ${personslap}! ${quoter}!**`)
          .setImage(slapr)
          .setColor();

      message.channel.send(embed);
      return;
  }

  if (personslap.id === message.author.id) {
      let personslap = 'they own damn selves';
      let embed = new MessageEmbed()
          .setDescription(`**<@${message.author.id}> just slapped ${personslap}! ${quoter}!**`)
          .setImage(slapr)
          .setColor();

      message.channel.send(embed);
      return;
  }

  if (personslap.id === client.user.id) {
      let personslap = 'me, the fricc?';
      let embed = new MessageEmbed()
          .setDescription(`**<@${message.author.id}> just slapped ${personslap}! ${quoter}!**`)
          .setImage(slapr)
          .setColor();

      message.channel.send(embed);
      return;
  }

  let embed = new MessageEmbed()
      .setDescription(`**<@${message.author.id}> just slapped ${personslap}! ${quoter}!**`)
      .setImage(slapr)
      .setColor();

  message.channel.send(embed);
}
});


client.login(token);