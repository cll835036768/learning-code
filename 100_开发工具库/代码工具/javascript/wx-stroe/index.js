function forIn(object, callback) {    // for in封装
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            callback(key, object[key])
        }
    }
    return object
}
class Store {
    constructor({ state = {}, mutations = {}, actions = {}, getters = {} }) {
        const _this = this
        // 类构造器, 初始化Vuex基本属性
        this.state = state
        this.actions = actions
        this.mutations = mutations
        this.getters = forIn(getters, (key, method)=>{
            Object.defineProperty(getters, key, {
                get() {
                    return method(_this.state)
                }
            })
        })
    }
    // 提交函数
    commit = (mt_name, params) => {
        this.mutations[mt_name](this.state, params)
    }
    // 派遣函数, 调用该函数寻找对应的actions执行, 改变状态
    dispatch(ac_name, params) {
        this.actions[ac_name]({ commit: this.commit.bind(this) }, params)
    }
    // 监视函数, 用于监听state指定值的改变
    watch(key, method) {
        const obj = this.state
        let value = obj[key]
        // 初始值存在 则执行一遍
        Object.defineProperty(obj, key, {
            set(set_val) {
                value = set_val
                method(set_val)
            },
            get() {
                return value
            }
        })
    }
    // 映射state与page产生数据绑定
    mapState(states_str, p_this) {
        // 初始化执行改变状态
        p_this.data = {
            ...p_this.data,
            ...states_str.reduce((total, key) => {
                total[key] = this.getters[key]
                return total
            }, {})
        }
        p_this.setData(p_this.data)
        // 进行动态监视
        states_str.forEach(key => {
            this.watch(key, value => {
                p_this.setData({ [key]: value })
            })
        })
    }
    // 映射返回相应的action
    mapActions(actions_str) {
        return actions_str.reduce((total, key) => {
            total[key] = params => {
                this.actions[key](this, params)
            }
            return total
        }, {})
    }
    // 映射返回相应的计算属性
    mapGetters(getters_str, p_this) {
        // 初始化执行改变状态
        p_this.data = {
            ...p_this.data,
            ...getters_str.reduce((total, key) => {
                total[key] = this.getters[key]
                return total
            }, {})
        }
        p_this.setData(p_this.data)
        // 进行动态监视
        getters_str.forEach(key => {
            this.watch(key, value => {
                p_this.setData({ [key]: value })
            })
        })
    }
}



const store = new Store({
    state: { count: 0 },
    mutations: {
        // 添加1
        ADD_COUNT(state) { state.count += 1 }
    },
    actions: {
        async addCountAsync({ commit }, params) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            commit('ADD_COUNT', params)
        }
    },
    getters: {
        calcul (state) {
            return state.count + 10
        }
    }
});

// 模拟小程序环境
const page = {
    setData(data) {
        this.data = { ...this.data, ...data }
        console.log('---setData---', this.data)
    },
    data: {
        a: 6
    },
    ...store.mapActions(['addCountAsync']),

    onLoad() {
        // store.mapState(['count'], this)
        store.mapGetters(['calcul'], this)
        this.addCountAsync()
    }
}
store.commit('ADD_COUNT')
console.log(store.getters.calcul)
page.onLoad()
