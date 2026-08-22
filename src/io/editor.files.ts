export type EditorFile = {
    filename: string;
    path: string;
    exists: boolean;
    handle?: FileSystemFileHandle;
}

export class EditorFiles {

    public current?: EditorFile;

    public mru: EditorFile[] = [];

    public mruLength: number = 10;

    public onNew() {
        this.current = undefined;
    }

    public add(file: EditorFile) {
        if (file) {
            this.current = { ...file };
            /* Remove any existing entry for the file from the MRU list */
            this.mru = this.mru.filter(item => item.path !== file.path);
            /* Add the new file to the front of the MRU list and trim it to the maximum length */
            this.mru.unshift({ ...this.current });
            /* Trim the MRU list to the maximum length */
            this.mru = this.mru.slice(0, this.mruLength);
            /* Save the updated MRU list to local storage */
            localStorage.setItem('mru', JSON.stringify(this.mru));
        }
    }

    // public update(file: EditorFile) {
    //     if (file) {
    //         /* We always update the current file which can be at the top of the MRU list */
    //         const index = this.mru.findIndex(item => item.path === file.path);
    //         if (index < 0) {
    //             /* If the file is not in the MRU list, we add it to the top of the list */
    //             this.add(file);
    //         } else {
    //             /* If the file is already in the MRU list, we bring it to the top */
    //             this.mru.splice(index, 1);
    //             this.add({ ...file });
    //         }
    //     }
    // }

    // private findIndex(file: EditorFile): number {
    //     if (!file) return -1;
    //     return this.mru.findIndex(item => item.path === file.path);
    // }

    public onOpen(file: string) {

        if (file) {
            const parts = file.split('/');
            if (parts.length > 0) {
                this.add({
                    filename: parts[parts.length - 1]!,
                    path: file,
                    exists: true,
                })
            }
        }
    }

    public onSave(file: string) {

        if (file) {
            const parts = file.split('/');
            if (parts.length > 0) {
                this.mru.shift();
                this.add({
                    filename: parts[parts.length - 1]!,
                    path: file,
                    exists: true,
                });
            }
        }
    }

    public onLoad() {
        const jsonStr = localStorage.getItem('mru');
        this.mru = [];
        if (jsonStr) try {
            this.mru = JSON.parse(jsonStr);
        } catch (e) {
        }
    }

    public static loaded(): EditorFiles {
        const _this = new EditorFiles();
        _this.onLoad();
        return _this;
    }

    public static wrapFile(file: FileSystemHandle): EditorFile | undefined {
        if (file?.name) {
            const parts = file.name.split('/');
            if (parts.length > 0) {
                return {
                    filename: parts[parts.length - 1]!,
                    path: file.name,
                    exists: true,
                    handle: file as FileSystemFileHandle,
                }
            }
        }
        return undefined;
    }

    public handleForPath(path: string): FileSystemFileHandle | undefined {
        const file = this.mru.find(item => item.path === path);
        if (file) {
            return file.handle;
        }
        return undefined;
    }
}