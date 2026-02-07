export const GameConfig = {
    // 游戏设置
    GAME_WIDTH: window.innerWidth, // 游戏宽度，默认为窗口宽度
    GAME_HEIGHT: window.innerHeight, // 游戏高度，默认为窗口高度
    
    // 玩家飞机设置
    PLAYER_WIDTH: 50, // 飞机宽度
    PLAYER_HEIGHT: 50, // 飞机高度
    PLAYER_COLOR: '#ffffff', // 飞机颜色（如果无法加载图片）
    PLAYER_SPEED: 5, // 飞机移动速度
    PLAYER_MAX_HP: 100, // 玩家最大生命值
    PLAYER_BASE_DAMAGE: 15, // 玩家基础攻击力
    PLAYER_BASE_FIRE_INTERVAL: 10, // 玩家基础射击间隔（帧数），越小越快
    PLAYER_START_Y_OFFSET: 100, // 飞机距离屏幕底部的起始距离
    
    // 子弹设置
    BULLET_RADIUS: 5, // 子弹半径
    BULLET_SPEED: 15, // 子弹飞行速度
    BULLET_COLOR: '#00ff00', // 子弹颜色
    BULLET_PENETRATION: 1, // 子弹穿透次数
    BULLET_DAMAGE_DECAY: 0.5, // 穿透后的伤害衰减系数
    
    // 龙（敌人）设置
    DRAGON_START_SPEED: 0.5, // 龙的初始移动速度
    DRAGON_SPEED_INC_PER_LEVEL: 0.1, // 每升一级增加的移动速度
    DRAGON_OSCILLATION_SPEED: 0.005, // 龙左右摆动的频率
    DRAGON_OSCILLATION_INC_PER_LEVEL: 0.001, // 每升一级增加的摆动频率
    DRAGON_SEGMENT_SPACING: 30, // 龙身体每节之间的间距
    DRAGON_BASE_LENGTH: 15, // 龙的基础长度（节数）
    DRAGON_LENGTH_INC_PER_LEVEL: 2, // 每升一级增加的长度
    DRAGON_MAX_LENGTH: 60, // 龙的最大长度限制
    GAME_WIN_LEVEL: 300, // 游戏胜利关卡
    DRAGON_SPAWN_INTERVAL_LEVELS: 50, // 每隔多少关增加一条龙

    // 龙身体块设置
    BLOCK_RADIUS_BODY: 20, // 身体块半径
    BLOCK_RADIUS_HEAD: 35, // 龙头半径
    BLOCK_HP_MIN: 10, // 身体块最小生命值
    BLOCK_HP_GROWTH_FACTOR: 1.05, // 身体块生命值增长系数 (指数增长)
    BLOCK_DAMAGE_TO_PLAYER: 1, // 每个剩余块对玩家造成的伤害 (1块 = 1伤害)
    HEAD_HP_BASE: 500, // 龙头基础生命值
    HEAD_HP_GROWTH_FACTOR: 1.1, // 龙头生命值每级增长系数 (指数增长)
    
    // Buff（增益）设置
    BUFF_CHANCE_ADD_PLANE: 0.2, // 掉落“增加副机”Buff的概率
    BUFF_CHANCE_ATTACK_SPEED: 0.4, // 掉落“增加攻速”Buff的概率
    BUFF_CHANCE_HEAL: 0.6, // 掉落“回血”Buff的概率
    BUFF_CHANCE_DEBUFF_SLOW: 0.8, // 掉落“减速(负面)”的概率
    // 剩余概率 (0.8-1.0) 为掉落“增加攻击力”Buff
    BUFF_FREQUENCY: 4, // 每隔多少个身体块出现一个Buff
    HEAL_AMOUNT: 20, // 回血量
    
    // 背景与天气设置
    SCROLL_SPEED: 2, // 背景滚动速度
    WEATHER_CHANGE_INTERVAL_MIN: 600, // 天气变化最小间隔（帧），约10秒
    WEATHER_CHANGE_INTERVAL_MAX: 1800, // 天气变化最大间隔（帧），约30秒
    SANDSTORM_CHANCE: 0.5, // 变为沙尘暴天气的概率
};
