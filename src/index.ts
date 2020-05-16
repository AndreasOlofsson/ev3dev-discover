import * as dnssd from './dnssd';
import * as os from 'os';

export async function findDevices() {
    const dnssdClient = await dnssd.getInstance();
    const browser = await dnssdClient.browse({
        ipv: 'IPv6',
        service: 'sftp-ssh'
    });

    let services: Array<dnssd.Service> = [];

    browser.on('added', (service) => {
        if (service.txt['ev3dev.robot.home']) {
            // this looks like an ev3dev device
            const ifaces = os.networkInterfaces();
            for (const ifaceName in ifaces) {
                if (ifaces[ifaceName]!.find(v => (<os.NetworkInterfaceInfoIPv6>v).scopeid === service.iface)) {
                    (<any>service)['ifaceName'] = ifaceName;
                    break;
                }
            }
            services.push(service);
        }
    });
    browser.on('removed', (service) => {
        const index = services.findIndex(si => si === service);
        if (index > -1) {
            services.splice(index, 1);
        }
    });

    // if there is a browser error, cancel the quick-pick and show
    // an error message
    browser.on('error', err => {
        browser.destroy();
        throw err;
    });

    await new Promise((resolve) => {
        setTimeout(resolve, 2000);
    });

    for (let service of services) {
        console.log(service.address);
    }

    process.exit(0);
}

findDevices();