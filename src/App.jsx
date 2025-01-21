import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import Box from '@mui/material/Box';

const themeDic = {
    light: createTheme({
        typography: {
            fontFamily: 'system-ui'
        },
        palette: {
            mode: 'light'
        },
        components: {
            MuiButton: {
                defaultProps: {
                    disableFocusRipple: true
                }
            }
        }
    }),
    dark: createTheme({
        typography: {
            fontFamily: 'system-ui'
        },
        palette: {
            mode: 'dark'
        },
        components: {
            MuiButton: {
                defaultProps: {
                    disableFocusRipple: true
                }
            }
        }
    })
}

export default class App extends React.Component {
    state = {
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        packFileList: [],
        ecpackPath: '',
        jdPath: '',
        treeData: []
    }

    componentDidMount() {
        // 主题切换事件
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.setState({ theme: e.matches ? 'dark' : 'light' })
        })
        this.setState({
            ecpackPath: window.ecpack.getPackPath(),
            jdPath: window.ecpack.getJdPath(),
            packFileList: window.ecpack.getAllFile(window.ecpack.getPackPath()),
            treeData: window.ecpack.getTreeData()
        })
        window.refresh = this.refresh;
    }

    handleOk = () => {
        window.ecpack.showClassSource()
    };

    zipDir = () => {
        window.ecpack.zipDir()
    }

    openDir = () => {
        window.ecpack.openDir()
    }

    selectDir = () => {
        var dir = window.ecpack.selectDir();
        if (dir[0].match("^[A-Za-z]:\\\\$")) {
            window.ecpack.showNotification("不能选择盘符根目录！")
        } else {
            window.ecpack.savePackPath(dir[0]);
            this.setState({
                ecpackPath: window.ecpack.getPackPath(),
                packFileList: window.ecpack.getAllFile(window.ecpack.getPackPath()),
                treeData: window.ecpack.getTreeData()
            })
        }
    }

    selectJdDir = () => {
        var dir = window.ecpack.selectJdDir();
        window.ecpack.saveJdPath(dir[0]);
        this.setState({
            jdPath: window.ecpack.getJdPath()
        })
    }

    refresh = () => {
        this.setState({
            packFileList: window.ecpack.getAllFile(window.ecpack.getPackPath()),
            treeData: window.ecpack.getTreeData()
        })
    }

    render() {
        const { theme, packFileList, ecpackPath, jdPath, treeData } = this.state

        return (
            <ThemeProvider theme={themeDic[theme]}>
                <div style={{ margin: '10px' }}>
                    <TextField
                        label="补丁包目录"
                        value={ecpackPath}
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                    <Button variant="contained" color="primary" onClick={() => this.selectDir()} style={{ marginLeft: '10px' }}>选择目录</Button>
                    <TextField
                        label="JD-GUI路径"
                        value={jdPath}
                        InputProps={{
                            readOnly: true,
                        }}
                        style={{ marginLeft: '10px' }}
                    />
                    <Button variant="contained" color="primary" onClick={() => this.selectJdDir()} style={{ marginLeft: '10px' }}>选择文件</Button>
                </div>
                <div style={{ margin: '10px' }}>
                    {
                        packFileList.map((a, i) => (
                            <div key={a}><p>{a}</p></div>
                        ))
                    }
                </div>
                <div style={{ margin: '10px' }}>
                    <Button variant="contained" color="primary" onClick={() => this.handleOk()}>查看反编译代码</Button>
                    <Button variant="contained" color="primary" onClick={() => this.zipDir()} style={{ marginLeft: '10px' }}>压缩成zip</Button>
                    <Button variant="contained" color="primary" onClick={() => this.openDir()} style={{ marginLeft: '10px' }}>打开目录</Button>
                </div>

                {treeData.length > 0 &&
                    <><div style={{ margin: '10px' }}>
                        文件树状结构：
                    </div>
                        <div style={{ margin: '10px' }}>
                            <Box>
                                <RichTreeView items={treeData} />
                            </Box>
                        </div></>
                }

            </ThemeProvider>
        )
    }
}

if (!window.setImmediate) {
    window.setImmediate = function (fn) {
        return setTimeout(fn, 0);
    }
}

window.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        this.refresh();
    }
});