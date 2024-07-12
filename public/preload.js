const fs = require('fs')
const path = require('path');
const uuid = require('node-uuid')
const exec = require('child_process').exec;

async function cmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

async function cmdInPath(cmd, workPath) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: workPath }, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

/**
 * 查询目标 目录下所有文件或文件夹名为 filename 的文件路径
 * @param {String} dir  查询目录
 * @param {String} filename  查询文件的名称
 * @returns {Array} 所有满足条件的文件路径
 */
function getAllDirbyFilename(dir, filename) {
    let dirPath = path.resolve(dir);
    let files = fs.readdirSync(dirPath); // 该文件夹下的所有文件名称 (文件夹 + 文件)
    let resultArr = [];

    files.forEach(file => {
        let filePath = dir + '/' + file; // 当前文件 | 文件夹的路径

        // 满足查询条件文件
        if (file.indexOf(filename) > 0) {
            resultArr.push(filePath);
        }

        // 继续深搜文件夹
        if (fs.statSync(filePath).isDirectory()) {
            resultArr.push(...getAllDirbyFilename(filePath, filename));
        }

    })

    return resultArr;
}

function getAllFile(dir) {
    let dirPath = path.resolve(dir);
    let files = fs.readdirSync(dirPath); // 该文件夹下的所有文件名称 (文件夹 + 文件)
    let resultArr = [];

    files.forEach(file => {
        let filePath = path.join(dir, file);

        if (fs.statSync(filePath).isFile() && filePath.indexOf('.DS_Store') < 0) {
            resultArr.push(filePath);
        }

        // 继续深搜文件夹
        if (fs.statSync(filePath).isDirectory()) {
            resultArr.push(...getAllFile(filePath));
        }

    })

    return resultArr;
}


function getAllFileRelative(dir) {
    var result = []
    var files = getAllFile(dir)
    files.forEach(file => {
        result.push(path.relative(dir, file))
    })
    return result
}

function getAllFileRelativeJson(dir) {
    let dirPath = path.resolve(dir);
    var rootName = dirPath.substring(dirPath.lastIndexOf(path.sep) + 1)
    var files = getAllFileRelative(dir)

    const tree = {
        id: 'root',
        label: rootName,
        children: []
    }

    for (const e of files) {
        let node = tree
        const nodenames = e.split('/')
        while (nodenames.length > 0) {
            const nodename = nodenames.shift()
            if (!node.children.map(e => e.label).includes(nodename)) {
                node.children.push({
                    id: nodename + '_' + uuid.v1(),
                    label: nodename,
                    children: []
                })
            }
            node = node.children.filter(e => e.label === nodename)[0]
        }
    }
    return tree
}

window.ecpack = {
    showNotification: (msg) => {
        return window.utools.showNotification(msg)
    },
    getAllFile: (dir) => {
        if (dir == null || dir == '') {
            return []
        }
        return getAllFile(dir)
    },
    showClassSource: () => {
        const nativeId = window.utools.getNativeId()
        let jdDir = window.utools.dbStorage.getItem('jd_path/' + nativeId)
        if (jdDir == null || jdDir == '') {
            window.utools.showNotification('请先设置jd-gui路径')
        } else {
            let fileArr = getAllDirbyFilename(window.utools.dbStorage.getItem('ecology_path/' + nativeId), '.class');
            let file = fileArr.length > 0 ? fileArr[0] : ''
            if (file == '') {
                window.utools.showNotification('无class文件，无需反编译查看')
            } else {
                let sh = jdDir + ' ' + file
                if (utools.isMacOS()) {
                    sh = 'open -a ' + jdDir + ' ' + file
                }
                cmd(sh)
            }
        }
    },
    savePackPath: (dir) => {
        const nativeId = window.utools.getNativeId()
        window.utools.dbStorage.setItem('ecology_path/' + nativeId, dir)
    },
    getPackPath: () => {
        const nativeId = window.utools.getNativeId()
        return window.utools.dbStorage.getItem('ecology_path/' + nativeId)
    },
    selectDir: () => {
        return window.utools.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        })
    },
    saveJdPath: (dir) => {
        const nativeId = window.utools.getNativeId()
        window.utools.dbStorage.setItem('jd_path/' + nativeId, dir)
    },
    getJdPath: () => {
        const nativeId = window.utools.getNativeId()
        return window.utools.dbStorage.getItem('jd_path/' + nativeId)
    },
    selectJdDir: () => {
        return window.utools.showOpenDialog({
            filters: [{ 'name': 'jd-gui', extensions: ['exe', 'app'] }],
            properties: ['openFile']
        })
    },
    zipDir: () => {
        const pacPath = window.ecpack.getPackPath()
        let index = pacPath.lastIndexOf(path.sep)
        let pacName = pacPath.substring(index + 1)
        let workPath = path.resolve(pacPath, '..')
        let zipName = pacName + '.zip'
        let sh = 'zip -q -r ' + zipName + ' ' + pacName
        let exists = fs.existsSync(path.join(workPath, zipName))
        if (exists && workPath.split(path.sep).length > 1 && zipName.endsWith('.zip')) {
            fs.unlinkSync(path.join(workPath, zipName))
        }
        cmdInPath(sh, workPath).then(() => {
            window.utools.showNotification('压缩完成，请查看！');
        })
    },
    openDir: () => {
        const pacPath = window.ecpack.getPackPath()
        window.utools.shellShowItemInFolder(pacPath)
    },
    getTreeData: () => {
        var arr = []
        const pacPath = window.ecpack.getPackPath()
        var data = getAllFileRelativeJson(pacPath)
        arr.push(data)
        return arr
    },
    loaded: true,
}