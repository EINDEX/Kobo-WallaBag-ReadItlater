# Getting Started Guide

Here is a small guide to getting this up and running on your local environment. 

*Changes made are done so at your own risk. This requires updating the Kobo Devices firmware. This should be safe, but you do so at your own risk* 

## Prerequisites

**Important** The instructions provided here are for a Kobo Clara HD Device. ***For Other Devices, please follow the guide at #TBD***

Currently this implementation requires you to host the server yourself, as it uses /etc/hosts file to redirect to a static ip. In this guide the output only works on the same wifi network, however it is possible to also use a public ip to achieve the same thing, but accessible on every network. 

In the future I am looking into a version that is hosted, rather than having a local version.  

This guide will assume the use of a server (like Raspberry Pi) or equivalent machine to host the server. If on Windows, you should be able to follow along using the [Windows subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/install). Please note that this has not been tested on WSL. 

## Updating your Kobo Clara HD e-reader

*Note* that the attached file is using version 4.37.21533 for a Kobo Clara HD E-Reader. If you need to follow these instructions for other versions, please use the following [website](https://pgaskin.net/KoboStuff/kobofirmware.html). 

Please go to section #TBD to see how to create the KoboRoot file from scratch. 

### Updating
Attached in this repository is a file, KoboRoot.tg.gz. It is located in the resources folder of this repository.

This file contains a NickelHook library, that redirects pocket requests to the host. In order to install this you must place it in the .kobo directory of your Kobo Device. Connect your device via USB, and place this file in the .kobo directory. This file may be hidden, and you will have to show hidden files if doing this via Explorer (Mac = CMD+Shift+.)

Reboot your device as you should see an update screen. Once completed, you will be placed back in the kobo screen. 

This update has done 2 things: 

* Enabled TelNet on your device (See [Here](https://yingtongli.me/blog/2018/07/30/kobo-telnet.html))
* A hook, PocketInterceptor, has been installed.

## Modifying your host file to redirect to your server

* On your server machine, run the following command `hostname -I` This will get the network ip of the device. Note this down, as you will need it for the next step. 

* Get the IP Address of your Kobo Device, You can see this in Settings -> Device Information. It should be in a format as follows: `192.168.x.x`    
    
* Telnet into the device by entering the following command `telnet {ip address}` - Replace {ip address} with the ip with the one got from your server machine.   
    * You should see a login screen. Enter `root`
    * It is a good idea to add a password here, do this by entering `passwd`.

* Enter the following command `sudo sh -c 'echo "{ip address} text.fckpocket.com fckkpocket.com" >> /etc/hosts'` - once again replacing {ip address} with the one got from your server machine.

* Reboot the device. 

## Running the Proxy

On the server device, in the terminal, do the following:

* Install NodeJs on your device. You can do so by following [this guide](https://www.golinuxcloud.com/install-nodejs-and-npm-on-raspberry-pi/#Method_1_Install_NodeJS_and_NPM_From_the_NodeSource_Repo)

* Clone this repository by running `git clone https://github.com/eindex/Kobo-Hoarder-Proxy` 

* Run the following commands:
    * `cd Kobo-Hoarder-Proxy`
    * `npm install`
    * `npm run build`
    * `npm start`

* The proxy is now running. You can also deploy it to Cloudflare Workers using `npm run deploy`.

## Connecting to Hoarder

In order to connect to Hoarder you need to do the following:

* Create an API Key at Hoarder (https://hoarder.app)
* Connect your Kobo e-reader device via USB. 
    * In folder `.kobo/Kobo/` There is a file called `Kobo eReader.conf`
    * Open this file and edit the following section. In the AccessToken section add any random string (this will be matched with the ACCESS_TOKEN in your server config)
    ```
    [Pocket]
    AccessToken=<Random String that matches ACCESS_TOKEN in wrangler.toml> 
    LastSync=0
    RemoveContentWhenRead=false
    UnsyncedUrls=@Invalid()
    Username=<Any Email>
    ```
* Update your wrangler.toml file with your Hoarder API key and the same ACCESS_TOKEN you used in the Kobo config:
    ```toml
    [vars]
    HOARDER_URL = "https://api.hoarder.app"
    HOARDER_API_KEY = "<Your Hoarder API Key>"
    ACCESS_TOKEN = "<Same Random String from Kobo config>"
    ```
* Reboot the device.

Now, when syncing articles, it should point to your server which will fetch articles from Hoarder. Pocket is no longer communicated with from here-on. 

### Troubleshooting

* Ensure that both your server and the Kobo Ereader are on the same network if running locally.
* Check the server logs for any API errors when syncing.
* Verify your Hoarder API key is correct and has the necessary permissions.
* Make sure the ACCESS_TOKEN matches between your server config and Kobo device config.
