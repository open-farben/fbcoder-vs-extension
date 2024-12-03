const config = {
    END_WORD: "$",
    PERMS_MIN_LEN: 2,
};

export class Trie {
    /**
     *
     *
     * @internal
     * @type {*}
     * @memberOf Trie
     */
    private _trie: any;

    constructor(input?: string[]) {
        this._trie = Trie._create(input);
    }

    public getIndex() {
        return this._trie;
    }

    public setIndex(trie: any) {
        this._trie = trie;
    }

    public addWord(word: string) {
        const reducer = (
            previousValue: any,
            currentValue: string,
            currentIndex: number,
            array: string[]
        ) => {
            return Trie._append(
                previousValue,
                currentValue,
                currentIndex,
                array
            );
        };

        const input: string[] = word /*.toLowerCase()*/
            .split("");
        input.reduce(reducer, this._trie);
        return this;
    }

    public removeWord(word: string) {
        const { prefixFound, prefixNode } = Trie._checkPrefix(this._trie, word);

        if (prefixFound) {
            delete prefixNode[config.END_WORD];
        }

        return this;
    }
    
    public getWords() {
        return Trie._recursePrefix(this._trie, "");
    }

    // 获取前辍
    public getPrefix(strPrefix: string) {
        // strPrefix = strPrefix.toLowerCase();
        if (!this._isPrefix(strPrefix)) {
            return [];
        }

        const { prefixNode } = Trie._checkPrefix(this._trie, strPrefix);

        return Trie._recursePrefix(prefixNode, strPrefix);
    }

    /**
     *
     *
     * @internal
     * @param {any} prefix
     * @returns
     *
     * @memberOf Trie
     */
    private _isPrefix(prefix: any) {
        const { prefixFound } = Trie._checkPrefix(this._trie, prefix);

        return prefixFound;
    }

    /**
     *
     * 在已有的内容上添加
     * @internal
     * @static
     * @param {any} trie
     * @param {any} letter
     * @param {any} index
     * @param {any} array
     * @returns
     *
     * @memberOf Trie
     */
    private static _append(trie: any, letter: any, index: any, array: any) {
        trie[letter] = trie[letter] || {};
        trie = trie[letter];

        if (index === array.length - 1) {
            trie[config.END_WORD] = 1;
        }

        return trie;
    }

    /**
     * 这个函数用于检查一个前缀是否存在于给定的节点中。
     * 它接受一个节点对象和一个前缀字符串作为参数，并返回一个包含前缀是否找到和最终节点的对象。
     * 函数将前缀字符串分割为字母并使用every方法逐个检查节点中是否存在这些字母。
     * 如果所有字母都存在，则返回true，否则返回false。
     * 在执行检查的过程中，函数会更新并返回最终的节点对象。
     * 检察前辍
     * @internal
     * @static
     * @param {any} prefixNode
     * @param {string} prefix
     * @returns
     *
     * @memberOf Trie
     */
    private static _checkPrefix(prefixNode: any, prefix: string) {
        const input: string[] = prefix /*.toLowerCase()*/
            .split("");
        const prefixFound = input.every((letter, index) => {
            if (!prefixNode[letter]) {
                return false;
            }
            return (prefixNode = prefixNode[letter]);
        });

        return {
            prefixFound,
            prefixNode,
        };
    }

    /**
     * 通过输入创建Trie对象
     * 创建字典树
     * @internal
     * @static
     * @param {any} input
     * @returns
     *
     * @memberOf Trie
     */
    private static _create(input: any) {
        // 将输入数据转换为trie对象
        const trie = (input || []).reduce((accumulator: any, item: any) => {
            item
                /*.toLowerCase()*/
                .split("")
                .reduce(Trie._append, accumulator);

            return accumulator;
        }, {});

        // 返回trie对象
        return trie;
    }

    /**
     *
     * 递归的前缀
     * @internal
     * @static
     * @param {any} node 节点对象
     * @param {any} prefix 当前前缀
     * @param {string[]} [prefixes=[]] 前缀数组，默认为空数组
     * @returns 排序后的前缀数组
     *
     * @memberOf Trie
     */
    private static _recursePrefix(
        node: any,
        prefix: any,
        prefixes: string[] = []
    ) {
        let word = prefix;

        for (const branch in node) {
            if (branch === config.END_WORD) {
                prefixes.push(word);
                word = "";
            }
            Trie._recursePrefix(node[branch], prefix + branch, prefixes);
        }

        return prefixes.sort();
    }
}
