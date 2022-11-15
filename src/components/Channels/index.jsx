import React, { useEffect, useRef, useState } from "react";
import Channel from "./Channel";

export default function Channels({
  channels,
  setChannels,
  getVideos,
}) {
  const [url, setUrl] = useState("");
  const [rsAddress, setRsAddress] = useState("");
  const matchRegex = /youtube.com\/(channel|user|c)\/[\w\-_]+/;
  const inputFile = useRef(null);

  useEffect(()=>{
    sortChannels()
  },[])

  function onSubmit(e) {
    e.preventDefault();
    if (url.match(matchRegex)) {
      fetch(
        "/newstube/channel?" +
          new URLSearchParams({
            url: url,
          })
      )
        .then((res) => res.json())
        .then((res) => {
          setUrl("");
          if (!channels.filter((e) => e.channelId === res.authorId).length) {
            sortChannels([
              ...channels,
              {
                channelId: res.authorId,
                channelName: res.author,
                thumbnail: res.authorThumbnails[1].url,
                url: res.authorUrl,
              },
            ])
            localStorage.setItem(
              "channels",
              JSON.stringify([
                ...channels,
                {
                  channelId: res.authorId,
                  channelName: res.author,
                  thumbnail: res.authorThumbnails[1].url,
                  url: res.authorUrl,
                },
              ])
            );
          }
        });
    }
  }

  function sortChannels(newChannels=[...channels]){
    newChannels.sort((a,b) => {
      let lowA = a.channelName.toLowerCase().replace(/^the/,'').trim()
      let lowB = b.channelName.toLowerCase().replace(/^the/,'').trim()

      return lowA > lowB
    })
    setChannels(newChannels)
  }

  function removeChannel(index) {
    let tempChannels = [...channels];
    let channel = tempChannels.splice(index, 1)[0];
    rsClient.remove("/channels/" + channel.channelId);
    setChannels(tempChannels);
    saveChannels();
  }

  function saveChannels(newChannels = null) {
    localStorage.setItem("channels", JSON.stringify(newChannels || channels));
  }

  function startPlayer() {
    // console.log(channels)
    getVideos();
    // rsClient.storeObject("channels", "channels", channels)
    // rsClient.storeFile("application/json", "channels.json", JSON.stringify(channels))
  }

  function importChannels(e) {
    let file = e.target.files[0];
    file.text().then((text) => {
      let parsed = JSON.parse(text);
      console.log(parsed);
      parsed.forEach((e) => {
        remoteStorage.newstube.addChannel(e);
      });
    });
  }

  function connectRS(e) {
    e.preventDefault();
    remoteStorage.connect(rsAddress);
    rsClient = remoteStorage.scope("/newstube/");
    // console.log(channels);
    rsClient.getAll("/").then((files) => {
      let newChannels = [...channels];
      files = files["channels/"];
      Object.keys(files).forEach((file) => {
        rsClient.getObject("/channels/" + file).then((e) => {
          console.log(e);
          newChannels.push(e);
        });
      });
      setChannels([...newChannels]);
      console.log(channels, newChannels);
    });
    // rsClient.getObject("/channels/UC12GAuU2Xe7CzEZAoKEwTeg").then(console.log)
    // rsClient.getFile("channels.json").then(console.log)
  }

  return (
    <div className="channels">
      <div className="channels-top">
        <form onSubmit={onSubmit} className="channels-form">
          <input
            name="url"
            type="url"
            placeholder="YouTube channel URL"
            onChange={(e) => setUrl(e.target.value)}
            value={url}
          />
          <input type="submit" value="Add" className="button" />
        </form>
        <div className="channels-buttons">
          <button className="button" onClick={() => inputFile.current.click()}>
            Import
          </button>
          <input
            type="file"
            id="file"
            ref={inputFile}
            onChange={importChannels}
            className="hidden"
          />
          {channels.length ? (
            <button className="button" onClick={startPlayer}>
              Save
            </button>
          ) : null}
        </div>
      </div>
      <hr />
      <ul className="channels-list">
        {channels.map((ch, i) => (
          <Channel
            i={i}
            thumbnail={ch.thumbnail}
            url={ch.url}
            channelName={ch.channelName}
            removeChannel={removeChannel}
          />
        ))}
      </ul>
      <hr />
      <div>
        <form className="channels-footer" onSubmit={connectRS}>
          <input
            type="text"
            value={rsAddress}
            placeholder="Remote Storage Address"
            onChange={(e) => setRsAddress(e.target.value)}
          />
          <input
            type="submit"
            className="button"
            onClick={connectRS}
            value="Connect"
          />
          <a
            className="button"
            href="https://5apps.com/storage"
            target="_blank"
            rel="noreferrer"
          >
            Info
          </a>
        </form>
      </div>
    </div>
  );
}
