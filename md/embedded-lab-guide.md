# 嵌入式动手实验室

> 面向有 C/C++ 基础的转行者，从零到做一个完整嵌入式项目的实操教程。
> 每课配：目标说明 → 接线图 → 代码（逐行注释）→ 预期现象 → 常见踩坑。

---

## 第 0 课：准备工作——买什么、装什么

### 你需要买的东西

| 物品 | 推荐型号 | 参考价 | 用途 |
|------|---------|-------|------|
| 开发板 | STM32 Nucleo-F103RB 或 F401RE | 80-120 元 | 核心学习平台，自带 ST-Link 调试器 |
| USB 线 | Micro-USB 数据线（不是充电线） | 10 元 | 给板子供电 + 烧录调试 |
| 面包板 | 830 孔面包板 | 10-15 元 | 插元器件用，免焊接 |
| 杜邦线 | 公对公 + 公对母各 20 根 | 5 元 | 连接板子和元器件 |
| LED | 5mm 发光二极管（3-5 个） | 1 元 | 点灯实验 |
| 电阻 | 220Ω 和 1kΩ 各 10 个 | 2 元 | 限流、上拉/下拉 |
| 按键 | 轻触开关（4 脚）x 3 个 | 1 元 | 外部中断实验 |
| 电位器 | 10kΩ 可调电阻 | 2 元 | ADC 实验 |
| 温湿度传感器 | SHT30 模块 | 8 元 | I2C 通信实验 |
| OLED 屏幕 | 0.96 寸 SSD1306（I2C 版） | 15 元 | SPI/I2C 显示实验 |
| USB-TTL | CH340G 模块 | 5 元 | 串口通信备用 |
| **合计** | | **约 150 元** | |

### 需要装的软件

1. **STM32CubeIDE** — ST 官方免费 IDE，去 st.com 下载（约 1GB）
2. **串口调试工具** — Putty 或 TeraTerm

### 你对 C 语言的需求

全程用 C。你需要知道的是：指针概念、结构体、函数调用。不需要 C++ 特性（类、模板等），嵌入式固件基本用纯 C。

---

## 第 1 课：点一个灯（HAL 库版）

### 目标

让 Nucleo 板上自带的 LED（通常接在 PA5 引脚）以 1Hz 闪烁。

### 原理

GPIO（通用输入输出）：MCU 通过寄存器控制引脚输出高电平（3.3V）或低电平（0V）。LED 接在 PA5 上，高电平亮，低电平灭。

### 接线

本课不需要额外接线。Nucleo 板载 LED 已经接好了：
- LD2（绿色 LED）→ PA5 引脚
- 串联一个限流电阻到 GND

### 代码（main.c）

```c
#include "main.h"

int main(void)
{
    // 1. 初始化 HAL 库
    HAL_Init();

    // 2. 配置系统时钟为 84MHz（HSE + PLL）
    SystemClock_Config();

    // 3. 配置 GPIO
    //    - 引脚: GPIO_PIN_5 (PA5)
    //    - 模式: GPIO_MODE_OUTPUT_PP（推挽输出）
    //    - 速度: GPIO_SPEED_FREQ_LOW
    //    - 上下拉: GPIO_NOPULL（无上下拉）
    __HAL_RCC_GPIOA_CLK_ENABLE();  // 打开 GPIOA 的时钟

    GPIO_InitTypeDef gpio = {0};
    gpio.Pin   = GPIO_PIN_5;
    gpio.Mode  = GPIO_MODE_OUTPUT_PP;  // 推挽输出
    gpio.Speed = GPIO_SPEED_FREQ_LOW;
    gpio.Pull  = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOA, &gpio);

    // 4. 主循环：500ms 亮，500ms 灭
    while (1)
    {
        HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);   // 亮
        HAL_Delay(500);                                        // 等 500ms

        HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET); // 灭
        HAL_Delay(500);
    }
}
```

### 代码逐行说明

- `HAL_Init()` — 配置 Flash 预取、SysTick 定时器（HAL_Delay 的时钟源）
- `__HAL_RCC_GPIOA_CLK_ENABLE()` — **GPIO 的时钟必须先打开，否则读写 GPIO 寄存器无效**。这是新手最容易忘的。
- `HAL_GPIO_Init()` — 结构体配置：哪个引脚、输出还是输入、速度、是否上下拉
- `HAL_GPIO_WritePin()` — 写高或写低
- `HAL_Delay(ms)` — 阻塞延时，基于 SysTick 中断。精度 ~ 1ms

### 在 CubeIDE 中操作步骤

1. 打开 CubeIDE → File → New → STM32 Project
2. 在 Board Selector 搜索你的 Nucleo 型号 → Next → Finish
3. 在 Pinout & Configuration 界面，找到 PA5 引脚，左键选 GPIO_Output
4. Clock Configuration 标签页，HCLK 输入 84 按回车，自动配时钟树
5. Code Generator 标签页，勾选 Generate peripheral initialization as a pair of .c/.h files
6. 点 Generate Code → 打开 main.c → 在 /* USER CODE BEGIN 3 */ 和 /* USER CODE END 3 */ 之间写 while 循环代码
7. 点绿色箭头（Run）→ OK → 程序烧录 → 观察板载 LED 闪烁

### 预期现象

LD2（绿色 LED）以 1 秒一个周期亮灭闪烁。

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| 忘记使能 GPIO 时钟 | 灯不亮 | 检查 `__HAL_RCC_GPIOA_CLK_ENABLE()` |
| CubeIDE 烧录时找不到调试器 | "No ST-LINK detected" | 检查 USB 线是否插到 ST-Link USB 口，不是 UART 那个口 |
| 代码写在了 /* USER CODE BEGIN */ 之外 | 下次 Generate 代码会被覆盖 | 必须写在 `USER CODE BEGIN/END` 之间的保护区 |

---

## 第 2 课：点一个灯（寄存器版）

### 目标

不用 HAL 库，直接操作寄存器让同一个 LED 闪烁。理解 HAL_GPIO_WritePin 背后在做什么。

### 原理

GPIO 通过一组寄存器控制：

| 寄存器 | 全称 | 做什么 |
|--------|------|--------|
| MODER | Mode Register | 配置引脚模式（输入/输出/复用/模拟） |
| OTYPER | Output Type Register | 推挽还是开漏 |
| OSPEEDR | Output Speed Register | 输出速度 |
| PUPDR | Pull-up/down Register | 内部上下拉 |
| ODR | Output Data Register | 写输出电平（读也是读这个值） |
| IDR | Input Data Register | 读输入电平 |
| BSRR | Bit Set/Reset Register | 原子操作置位/复位（比写 ODR 安全） |

### 代码

```c
#include "main.h"

// GPIOA 的基地址从参考手册查得：0x40020000
// 各寄存器的偏移量（ARM 标准）：
//   MODER  @ 0x00
//   OTYPER @ 0x04
//   OSPEEDR@ 0x08
//   PUPDR  @ 0x0C
//   ODR    @ 0x14
//   BSRR   @ 0x18

#define GPIOA_MODER   (*(volatile uint32_t *)0x40020000)
#define GPIOA_ODR     (*(volatile uint32_t *)0x40020014)
#define GPIOA_BSRR    (*(volatile uint32_t *)0x40020018)
#define RCC_AHB1ENR   (*(volatile uint32_t *)0x40023830)

int main(void)
{
    // 1. 使能 GPIOA 时钟
    //    RCC_AHB1ENR 的 bit0 是 GPIOA 的时钟使能位
    RCC_AHB1ENR |= (1 << 0);

    // 2. 配置 PA5 为输出模式
    //    MODER 每 2 个 bit 配置一个引脚：
    //      00 = 输入, 01 = 输出, 10 = 复用, 11 = 模拟
    //    PA5 对应 MODER 的 bit[11:10]（因为 5*2=10）
    GPIOA_MODER &= ~(3 << 10);  // 先清零这两位
    GPIOA_MODER |=  (1 << 10);  // 设置为 01（输出模式）

    // 3. 主循环：闪烁
    while (1)
    {
        // 写 BSRR：低 16 位是置位（写 1 对应引脚输出高）
        //          高 16 位是复位（写 1 对应引脚输出低）
        GPIOA_BSRR = (1 << 5);  // PA5 输出高 → LED 亮
        for (volatile uint32_t i = 0; i < 500000; i++);  // 粗略延时

        GPIOA_BSRR = (1 << (5 + 16));  // PA5 输出低 → LED 灭
        for (volatile uint32_t i = 0; i < 500000; i++);
    }
}
```

### 代码逐行说明

- `(volatile uint32_t *)0x40020000` — 把地址 0x40020000 解释成一个 volatile 无符号 32 位整数的指针。`volatile` 告诉编译器不要优化对这个地址的读写——因为寄存器的值可能被硬件改变？
- `RCC_AHB1ENR |= (1 << 0)` — 位操作：GPIOA 的时钟使能位是 bit0。不使能时钟，写 GPIO 寄存器无效（硬件设计的省电机制）
- `GPIOA_MODER &= ~(3 << 10)` — 先清零 PA5 对应的两个 bit（10-11）
- `GPIOA_MODER |= (1 << 10)` — 再置 bit10 为 1，bit11 保持 0，得到 01（输出模式）
- `for (volatile uint32_t i...` — 空循环延时。`volatile` 防止编译器优化掉这个循环

### 寄存器版 vs HAL 版的对比

```
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET)
    ↓ 等价于
GPIOA->BSRR = GPIO_PIN_5

HAL_GPIO_Init(GPIOA, &gpio)
    ↓ 等价于
GPIOA->MODER  = xxx;
GPIOA->OTYPER = xxx;
GPIOA->OSPEEDR = xxx;
GPIOA->PUPDR  = xxx;
```

### 预期现象

和上一课一样，LED 以约 1Hz 闪烁（但空循环延时不准，实际频率会有偏差）。

### 常见坑

| 坑 | 解决 |
|----|------|
| 寄存器的地址记错 | 打开 STM32 参考手册（Reference Manual）的 Memory Map 章节，对着地址查 |
| 位操作写反了 | `|=` 是置位，`&= ~` 是清零。写错会导致引脚不能正常工作 |
| 忘记 volatile | 编译器会把空循环优化掉，LED 要么常亮要么常灭 |

---

## 第 3 课：按键中断

### 目标

按下板载按键（PC13），LED 切换亮灭。用外部中断，而不是轮询。

### 原理

外部中断/事件控制器（EXTI）可以检测 GPIO 引脚上的上升沿、下降沿或双边沿，触发对应的中断服务函数（ISR）。NVIC（嵌套向量中断控制器）负责中断优先级的裁决。

Nucleo 板上的蓝色按键接在 PC13，按下时电平变低（下降沿）。

### 接线

不需要额外接线。板载按键：
- 用户按键（B1）→ PC13 → 按下接地（低电平有效）

### 代码

```c
#include "main.h"

// 全局变量：记录 LED 状态
volatile uint8_t led_state = 0;

int main(void)
{
    HAL_Init();
    SystemClock_Config();

    // 配置 PA5 为输出（LED）
    __HAL_RCC_GPIOA_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin   = GPIO_PIN_5;
    gpio.Mode  = GPIO_MODE_OUTPUT_PP;
    gpio.Speed = GPIO_SPEED_FREQ_LOW;
    gpio.Pull  = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOA, &gpio);

    // 配置 PC13 为中断输入
    __HAL_RCC_GPIOC_CLK_ENABLE();
    gpio.Pin   = GPIO_PIN_13;
    gpio.Mode  = GPIO_MODE_IT_FALLING;  // 下降沿触发中断
    gpio.Pull  = GPIO_PULLUP;           // 内部上拉，不按时是高电平
    HAL_GPIO_Init(GPIOC, &gpio);

    // 配置 NVIC：使能 EXTI15_10 中断（PC13 属于这组）
    HAL_NVIC_SetPriority(EXTI15_10_IRQn, 0, 0);  // 优先级最高
    HAL_NVIC_EnableIRQ(EXTI15_10_IRQn);

    // LED 初始状态：灭
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);

    while (1)
    {
        // 主循环什么都不做，中断会处理
        // 但在实际产品中，主循环会做其他事情
        HAL_Delay(1000);
    }
}

// 中断服务函数：EXTI 线 10-15 共享一个中断入口
void EXTI15_10_IRQHandler(void)
{
    // 检查是不是 PC13 触发的中断
    if (__HAL_GPIO_EXTI_GET_IT(GPIO_PIN_13) != RESET)
    {
        // 切换 LED 状态
        led_state = !led_state;
        HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5,
            led_state ? GPIO_PIN_SET : GPIO_PIN_RESET);

        // 清除中断标志位（必须！否则会一直重入）
        __HAL_GPIO_EXTI_CLEAR_IT(GPIO_PIN_13);
    }
}
```

### 代码逐行说明

- `GPIO_MODE_IT_FALLING` — 配置为中断模式，下降沿触发。当引脚从高电平变到低电平时，硬件产生中断请求
- `HAL_NVIC_SetPriority()` — 设置中断优先级。两个参数：抢占优先级和子优先级。越小越优先
- `EXTI15_10_IRQn` — 这是中断通道号。PC13 的 EXTI 线是 13，属于 10-15 这组
- `__HAL_GPIO_EXTI_CLEAR_IT()` — **清中断标志。不清会反复进中断，这是典型 bug**

### 预期现象

按一下蓝色按键，LED 亮；再按一下，LED 灭。主循环里 HAL_Delay 仍然在执行，但按键响应不会被阻塞。

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| 没清中断标志 | 进一次中断后死机，或者按键只触发一次就一直跑中断 | 检查 ISR 里调用了 `__HAL_GPIO_EXTI_CLEAR_IT()` |
| 按键抖动 | 按一次灯闪了两次 | 硬件加电容消抖，或软件加 20-50ms 延时消抖（延时消抖：进中断后等 20ms 再读一次状态） |
| 优先级设错了 | 多个中断互相干扰 | 检查 HAL_NVIC_SetPriority 的参数 |
| 中断函数名拼错 | 中断不触发或编译 Warning | EXTI15_10_IRQHandler 是固定名字，去 startup.s 文件里查向量表确认 |

---

## 第 4 课：PWM 呼吸灯

### 目标

让 LED 从暗到亮再暗，模拟呼吸效果。使用定时器的 PWM 输出功能。

### 原理

PWM（脉冲宽度调制）：在一个固定周期内，控制高电平的宽度（占空比）。占空比从 0% 到 100%，LED 的亮度从暗到亮。

定时器的自动重载寄存器（ARR）决定 PWM 的周期。捕获/比较寄存器（CCR）决定占空比。

### 接线

不需要额外接线。使用板载 LED（PA5），但要注意 PA5 是否支持 TIM2 的通道 1 输出（查 datasheet 的 AF 表确认）。

Nucleo-F103RB 的 PA5 复用为 TIM2_CH1。

### 代码

```c
#include "main.h"

TIM_HandleTypeDef htim2;

void MX_TIM2_Init(void)
{
    TIM_OC_InitTypeDef sConfigOC = {0};

    // 1. 使能 TIM2 时钟
    __HAL_RCC_TIM2_CLK_ENABLE();

    // 2. 配置定时器基础参数
    htim2.Instance               = TIM2;
    htim2.Init.Prescaler         = 84 - 1;    // 84MHz / 84 = 1MHz
    htim2.Init.CounterMode       = TIM_COUNTERMODE_UP;
    htim2.Init.Period            = 1000 - 1;  // 1MHz / 1000 = 1kHz PWM
    htim2.Init.ClockDivision     = TIM_CLOCKDIVISION_DIV1;
    htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;
    HAL_TIM_PWM_Init(&htim2);

    // 3. 配置 PWM 通道
    sConfigOC.OCMode     = TIM_OCMODE_PWM1;      // PWM 模式 1
    sConfigOC.Pulse      = 0;                     // 初始占空比 0%
    sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;   // 高电平有效
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
    HAL_TIM_PWM_ConfigChannel(&htim2, &sConfigOC, TIM_CHANNEL_1);
}

void set_duty(uint16_t duty)
{
    // CCR 的值 = 占空比数值（0 ~ Period）
    __HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, duty);
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();

    // 配置 PA5 为 TIM2_CH1 复用功能
    __HAL_RCC_GPIOA_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin       = GPIO_PIN_5;
    gpio.Mode      = GPIO_MODE_AF_PP;       // 复用推挽输出
    gpio.Speed     = GPIO_SPEED_FREQ_LOW;
    gpio.Alternate = GPIO_AF1_TIM2;          // 查手册确认 AF1
    HAL_GPIO_Init(GPIOA, &gpio);

    // 初始化定时器 PWM
    MX_TIM2_Init();

    // 启动 PWM 输出
    HAL_TIM_PWM_Start(&htim2, TIM_CHANNEL_1);

    uint16_t duty = 0;
    int8_t dir = 1;  // 1 = 变亮, -1 = 变暗

    while (1)
    {
        set_duty(duty);
        HAL_Delay(5);  // 每 5ms 调整一次

        duty += dir;
        if (duty >= 999) dir = -1;   // 到达 100% 反向
        if (duty <= 0)   dir = 1;    // 到达 0% 反向
    }
}
```

### 代码逐行说明

- `Prescaler = 84 - 1` — 预分频器。84MHz / 84 = 1MHz，所以计数器每 1μs 加 1
- `Period = 1000 - 1` — 从 0 数到 999，一共 1000 个脉冲。周期 = 1000 × 1μs = 1ms，即 PWM 频率 1kHz
- `__HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, duty)` — 设置 CCR 值，改变占空比。duty=0 时全灭，duty=999 时全亮
- `GPIO_AF1_TIM2` — 把 PA5 的复用功能从 GPIO 切换到 TIM2_CH1。不设这步，引脚输出不了 PWM。查 STM32 参考手册的 Alternate Function 表确认 AF 编号
- `HAL_TIM_PWM_Start()` — 使能定时器的 PWM 输出，硬件开始自动产生 PWM 波形

### 预期现象

LED 从暗渐亮到最亮，再渐暗到灭，反复循环，像呼吸一样。

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| 引脚复用功能没设 | 灯不亮 | 确认 `gpio.Mode = GPIO_MODE_AF_PP` 和 `gpio.Alternate = GPIO_AF1_TIM2` |
| AF 编号错了 | LED 不响应 | 打开 datasheet 查 PA5 对应的 AF 表，有的是 AF1 有的是 AF2 |
| Prescaler 写 0 | 计数器跑太快，几乎没有亮度变化 | Prescaler 写得越大，PWM 周期越长。84-1 是 1μs 步进 |

---

## 第 5 课：UART 串口打印 "Hello"

### 目标

让开发板通过串口线向电脑发送 "Hello, Embedded!"。这是最简单的"调试输出"方式——嵌入式世界的 printf。

### 原理

UART（通用异步收发器）是一种异步串行通信协议。用两根线：TX（发送）和 RX（接收）。没有时钟线，双方约定相同的波特率（bps）来采样。

Nucleo 板上的 ST-Link 提供了一个虚拟串口，连接到电脑的 USB 上。UART2 的 TX（PA2）和 RX（PA3）默认接在 ST-Link 上。

### 接线

不需要额外接线。板载 ST-Link 虚拟串口已经连好了：
- ST-Link USB 口 → 电脑 → 虚拟 COM 口
- USART2_TX → PA2（板载已接好，不需要杜邦线）

在电脑上打开设备管理器，端口（COM 和 LPT）下能看到 "STMicroelectronics Virtual COM Port"。

### 代码

```c
#include "main.h"
#include <stdio.h>  // 为了 sprintf

UART_HandleTypeDef huart2;

void MX_USART2_UART_Init(void)
{
    huart2.Instance          = USART2;
    huart2.Init.BaudRate     = 115200;            // 波特率
    huart2.Init.WordLength   = UART_WORDLENGTH_8B;
    huart2.Init.StopBits     = UART_STOPBITS_1;
    huart2.Init.Parity       = UART_PARITY_NONE;
    huart2.Init.Mode         = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl    = UART_HWCONTROL_NONE;
    huart2.Init.OverSampling = UART_OVERSAMPLING_16;
    HAL_UART_Init(&huart2);
}

// 重定向 printf 到串口
int __io_putchar(int ch)
{
    HAL_UART_Transmit(&huart2, (uint8_t *)&ch, 1, 100);
    return ch;
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();

    // GPIO 和 UART 初始化
    MX_GPIO_Init();        // CubeIDE 生成的 GPIO 初始化
    MX_USART2_UART_Init();

    char buf[64];

    while (1)
    {
        sprintf(buf, "Hello, Embedded! Tick = %lu\r\n", HAL_GetTick());
        HAL_UART_Transmit(&huart2, (uint8_t *)buf, strlen(buf), 100);

        // 如果重定义了 __io_putchar，也可以用 printf
        // printf("Tick = %lu\r\n", HAL_GetTick());

        HAL_Delay(1000);
    }
}
```

### 代码逐行说明

- `HAL_UART_Init()` — 初始化 UART 外设：波特率、数据位、停止位、校验位
- `HAL_UART_Transmit()` — 阻塞发送。参数：UART 句柄、数据指针、长度、超时时间
- `HAL_GetTick()` — 返回自 HAL_Init() 以来的毫秒数。SysTick 中断自动递增
- `__io_putchar()` — 重定向 printf 的标准输出到 UART。需要在 CubeIDE 的 Project → Properties → C/C++ Build → Settings → MCU GCC Linker → Miscellaneous 里勾选 `--specs=nano.specs -u _printf_float`

### 预期现象

打开串口工具（Putty 或 TeraTerm），选对应的 COM 口，波特率 115200。如果没问题，每秒会收到一行：
```
Hello, Embedded! Tick = 1000
Hello, Embedded! Tick = 2000
Hello, Embedded! Tick = 3000
...
```

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| 找不到 COM 口 | 设备管理器没有串口 | 检查 USB 是否插到 ST-Link 口，装 ST-Link 驱动 |
| 波特率不匹配 | 收到乱码 | 确认串口工具和代码里的 BaudRate 一致（115200） |
| RX/TX 反了 | 没数据 | 板载烧录器已经接好了 TX/RX，不需要额外接线。如果自己接，TX 对 RX，RX 对 TX |
| printf 不输出 | 编译过了但没打印 | 检查 linker flags 是否加了 `--specs=nano.specs` 和 `-u _printf_float` |

---

## 第 6 课：I2C 读温度传感器

### 目标

通过 I2C 总线从 SHT30 温湿度传感器读取温度值，通过串口打印出来。

### 原理

I2C 是一种同步、多主多从的串行通信协议。两根线：SCL（时钟线）和 SDA（数据线）。每个从设备有唯一的 7 位地址。

SHT30 的 I2C 地址是 0x44（ADDR 引脚接 GND）或 0x45（接 VCC）。数据手册里通常写作 0x88（8 位左移 1 位的写法）。

### 接线

```
Nucleo板          SHT30 模块
 PA9 (SCL)  ────  SCL
 PA10 (SDA) ────  SDA
 3.3V       ────  VCC
 GND        ────  GND
```

如果模块和 Nucleo 板供电电压不同（一个 3.3V 一个 5V），需要加电平转换。SHT30 是 3.3V，Nucleo 的 I2C 引脚也是 3.3V（F103 是 5V 容忍，但建议统一用 3.3V）。

### 代码

```c
#include "main.h"
#include <stdio.h>

I2C_HandleTypeDef hi2c1;

#define SHT30_ADDR    0x44 << 1   // I2C 地址（7 位左移 1 位变成 8 位）
#define SHT30_CMD_MSB 0x2C        // 单次测量命令高字节
#define SHT30_CMD_LSB 0x06        // 单次测量命令低字节（高重复性）

void MX_I2C1_Init(void)
{
    hi2c1.Instance             = I2C1;
    hi2c1.Init.Timing          = 0x00201D2B;  // 100kHz（STM32CubeMX 自动计算）
    hi2c1.Init.OwnAddress1     = 0;
    hi2c1.Init.AddressingMode  = I2C_ADDRESSINGMODE_7BIT;
    hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
    hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
    hi2c1.Init.NoStretchMode   = I2C_NOSTRETCH_DISABLE;
    HAL_I2C_Init(&hi2c1);
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_I2C1_Init();
    MX_USART2_UART_Init();  // 复用上一课的串口打印

    uint8_t cmd[2] = {SHT30_CMD_MSB, SHT30_CMD_LSB};
    uint8_t buf[6];  // 返回 6 字节：温度 MSB/LSB/CRC + 湿度 MSB/LSB/CRC
    float temp, hum;

    while (1)
    {
        // 1. 发送测量命令
        HAL_I2C_Master_Transmit(&hi2c1, SHT30_ADDR, cmd, 2, 100);

        HAL_Delay(20);  // 等传感器完成测量（最长 15ms）

        // 2. 读取 6 字节数据
        HAL_I2C_Master_Receive(&hi2c1, SHT30_ADDR, buf, 6, 100);

        // 3. 将原始值转换为温度和湿度
        //    温度 = -45 + 175 * (raw / 65535)
        uint16_t raw_temp = (buf[0] << 8) | buf[1];
        temp = -45.0f + 175.0f * (float)raw_temp / 65535.0f;

        uint16_t raw_hum = (buf[3] << 8) | buf[4];
        hum = 100.0f * (float)raw_hum / 65535.0f;

        // 4. 通过串口打印
        char msg[64];
        sprintf(msg, "Temp: %.2f C, Hum: %.2f %%\r\n", temp, hum);
        HAL_UART_Transmit(&huart2, (uint8_t *)msg, strlen(msg), 100);

        HAL_Delay(2000);
    }
}
```

### 代码逐行说明

- `SHT30_ADDR 0x44 << 1` — STM32 的 HAL 库要求 I2C 地址是 8 位格式（7 位地址左移 1 位，最低位是 R/W 位，由 HAL 自动填充）
- `HAL_I2C_Master_Transmit()` — 主机发送：起始条件 → 设备地址（写）→ 数据 → 停止条件
- `HAL_I2C_Master_Receive()` — 主机接收：起始条件 → 设备地址（读）→ 读取数据 → 停止条件
- `buf[0] << 8 | buf[1]` — 把两个 8 位合并成一个 16 位。温度值的大端格式：MSB 在前
- `-45 + 175 * raw / 65535` — SHT30 数据手册上给的计算公式

### 预期现象

串口每秒输出一次：
```
Temp: 25.43 C, Hum: 58.21 %
Temp: 25.47 C, Hum: 58.15 %
...
```
用手指捏住传感器，温度读数会上升。

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| I2C 地址错了 | HAL_I2C_Master_Transmit 返回 HAL_ERROR | 检查传感器型号，查 datasheet 确认 7 位地址 |
| 没接上拉电阻 | I2C 通信不稳定或失败 | I2C 总线需要 4.7kΩ 上拉电阻到 3.3V。Nucleo 板的 I2C 引脚有板载上拉，但面包板接长线建议外加 |
| Timing 参数不对 | I2C 通信超时 | Timing 参数由 CubeMX 根据时钟频率和 I2C 速率自动算出，不要手动改 |
| 传感器供电不足 | 读数异常 | 从 3.3V 供电，不要用 5V |

---

## 第 7 课：SPI 驱动 OLED 屏幕

### 目标

用 SPI 总线驱动 SSD1306 OLED 屏幕，显示 "Hello" 文字。

### 原理

SPI 是全双工同步串行协议。四根线：
- SCK（时钟线）
- MOSI（主机输出，从机输入）
- MISO（主机输入，从机输出）— OLED 通常不接，浮空
- CS（片选，低电平有效）

SSD1306 由 128×64 个像素组成，每个像素 1 bit（亮/灭）。显示内容写入 1KB 的 GDDRAM 中。

### 接线

```
Nucleo F103RB         SSD1306 (SPI 版)
 PA5 (SCK)      ────  SCL/SCK
 PA7 (MOSI)     ────  SDA/MOSI
 PA4 (CS)       ────  CS
 PA3 (DC)       ────  DC（数据/命令选择）
 PA2 (RST)      ────  RES/RST
 3.3V           ────  VCC
 GND            ────  GND
```

### 代码

```c
#include "main.h"
#include <stdio.h>
#include <string.h>

SPI_HandleTypeDef hspi1;

// OLED 引脚定义（用 GPIO 控制）
#define OLED_CS_PIN     GPIO_PIN_4
#define OLED_CS_PORT    GPIOA
#define OLED_DC_PIN     GPIO_PIN_3
#define OLED_DC_PORT    GPIOA
#define OLED_RST_PIN    GPIO_PIN_2
#define OLED_RST_PORT   GPIOA

// OLED 命令宏
#define OLED_CMD  0
#define OLED_DATA 1

void OLED_Write(uint8_t type, uint8_t data)
{
    HAL_GPIO_WritePin(OLED_DC_PORT, OLED_DC_PIN, type);  // DC = 0:命令, 1:数据
    HAL_GPIO_WritePin(OLED_CS_PORT, OLED_CS_PIN, GPIO_PIN_RESET);  // CS 拉低
    HAL_SPI_Transmit(&hspi1, &data, 1, 100);
    HAL_GPIO_WritePin(OLED_CS_PORT, OLED_CS_PIN, GPIO_PIN_SET);    // CS 拉高
}

void OLED_Init(void)
{
    HAL_Delay(100);

    // 硬件复位
    HAL_GPIO_WritePin(OLED_RST_PORT, OLED_RST_PIN, GPIO_PIN_RESET);
    HAL_Delay(10);
    HAL_GPIO_WritePin(OLED_RST_PORT, OLED_RST_PIN, GPIO_PIN_SET);
    HAL_Delay(10);

    // 初始化命令序列（来自 SSD1306 数据手册）
    OLED_Write(OLED_CMD, 0xAE);  // 关闭显示
    OLED_Write(OLED_CMD, 0xD5);  // 设置显示时钟分频
    OLED_Write(OLED_CMD, 0x80);
    OLED_Write(OLED_CMD, 0xA8);  // 设置多路复用比
    OLED_Write(OLED_CMD, 0x3F);  // 64
    OLED_Write(OLED_CMD, 0xD3);  // 设置显示偏移
    OLED_Write(OLED_CMD, 0x00);
    OLED_Write(OLED_CMD, 0x40);  // 设置显示开始行
    OLED_Write(OLED_CMD, 0x8D);  // 电荷泵
    OLED_Write(OLED_CMD, 0x14);  // 启用
    OLED_Write(OLED_CMD, 0x20);  // 内存寻址模式
    OLED_Write(OLED_CMD, 0x00);  // 水平寻址
    OLED_Write(OLED_CMD, 0xA1);  // 段重映射（列 127 = SEG0）
    OLED_Write(OLED_CMD, 0xC8);  // COM 扫描方向
    OLED_Write(OLED_CMD, 0xDA);  // COM 引脚配置
    OLED_Write(OLED_CMD, 0x12);
    OLED_Write(OLED_CMD, 0x81);  // 对比度
    OLED_Write(OLED_CMD, 0xCF);
    OLED_Write(OLED_CMD, 0xD9);  // 预充电周期
    OLED_Write(OLED_CMD, 0xF1);
    OLED_Write(OLED_CMD, 0xDB);  // VCOMH 失配电压
    OLED_Write(OLED_CMD, 0x40);
    OLED_Write(OLED_CMD, 0xA4);  // 全局显示开启（从 RAM）
    OLED_Write(OLED_CMD, 0xA6);  // 正常显示（非反色）
    OLED_Write(OLED_CMD, 0xAF);  // 打开显示
}

void OLED_Clear(void)
{
    // 清空 GDDRAM（128 × 64 / 8 = 1024 字节）
    for (uint16_t i = 0; i < 1024; i++)
        OLED_Write(OLED_DATA, 0x00);
}

// 6×8 字体点阵（只放一个 'H' 作为示例）
const uint8_t font_6x8_H[] = {
    0x00, 0x00, 0x7C, 0x12, 0x12, 0x7C  // H
};

void OLED_ShowChar(uint8_t x, uint8_t y, char ch)
{
    // 简单的点阵字符显示
    // 每个字符 6 列 × 8 行，对应 6 字节
    uint8_t c = ch - 32;  // ASCII 偏移
    // 实际需要完整的字库表（ASCII 码表），这里简化
    // 完整实现可以用 U8g2 库（见附录）
    OLED_Write(OLED_DATA, 0x7C); OLED_Write(OLED_DATA, 0x12);
    OLED_Write(OLED_DATA, 0x12); OLED_Write(OLED_DATA, 0x7C);
    OLED_Write(OLED_DATA, 0x12); OLED_Write(OLED_DATA, 0x12);
}

void OLED_ShowString(uint8_t x, uint8_t y, const char *str)
{
    while (*str) {
        OLED_ShowChar(x, y, *str);
        x += 6;
        if (x > 122) { x = 0; y += 8; }
        str++;
    }
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_SPI1_Init();

    OLED_Init();
    OLED_Clear();

    // 在第 0 行第 16 列显示 "Hello"
    // 注意：需要完整的 6x8 字库才能正常显示
    // 这里用简化的方式，仅演示流程
    for (uint8_t i = 0; i < 5; i++)
        OLED_ShowChar(16 + i * 6, 0, "Hello"[i]);

    while (1)
    {
        HAL_Delay(1000);
    }
}
```

### 代码逐行说明

- `OLED_Write()` — SPI 写一字节，先控制 DC 引脚区分命令还是数据，CS 拉低选中设备，发送完成后 CS 拉高
- 初始化命令序列 — 每个 OLED 屏需要一套特定的初始化命令，数据手册会给出。ST 的 HAL 库没有对 SSD1306 的封装，所以需要自己按手册把命令写出来
- `OLED_Clear()` — 往 GDDRAM 写 1024 个 0x00，清屏
- `OLED_ShowChar()` — 在指定位置显示一个字符。这里用了简化的实现，实际项目中建议用 u8g2 库（见附录）

### 完整的字库

真实项目中不会手动写每个字符的点阵。推荐使用 u8g2 库，它封装了 SSD1306 的驱动和字库：
```c
// u8g2 方式（不是本课示例，只是附录参考）
u8g2_ClearBuffer(&u8g2);
u8g2_SetFont(&u8g2, u8g2_font_6x10_tf);
u8g2_DrawStr(&u8g2, 16, 20, "Hello");
u8g2_SendBuffer(&u8g2);
```

### 预期现象

OLED 屏幕点亮，显示 "Hello" 文字。

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| SPI 模式错了 | OLED 不显示 | SSD1306 需要 SPI Mode 3（CPOL=1, CPHA=1），在 CubeMX 的 SPI 设置里选 Mode 3 |
| 初始化命令不对 | 屏幕不亮或者花屏 | 核对 datasheet 给的初始化序列，不同厂商的 SSD1306 模块可能有细微差异 |
| DC 引脚没设 | 屏幕不响应 | DC 引脚区分命令和数据，不设的话全部当成数据发过去，初始化无效 |

---

## 第 8 课：ADC 采样

### 目标

读取电位器的模拟电压值，通过串口打印。

### 原理

ADC（模数转换器）把连续的模拟电压转换成离散的数字量。STM32F103 的 ADC 是 12 位的，所以返回值范围 0-4095，对应电压 0V-3.3V。

### 接线

```
Nucleo F103RB     电位器（10kΩ）
 PA0 (ADC1_IN0) ──── 中间抽头（wiper）
 3.3V           ──── 一端
 GND            ──── 另一端
```

### 代码

```c
#include "main.h"
#include <stdio.h>

ADC_HandleTypeDef hadc1;

void MX_ADC1_Init(void)
{
    hadc1.Instance                   = ADC1;
    hadc1.Init.ClockPrescaler        = ADC_CLOCK_SYNC_PCLK_DIV4;
    hadc1.Init.Resolution            = ADC_RESOLUTION_12B;  // 12 位
    hadc1.Init.ScanConvMode          = DISABLE;
    hadc1.Init.ContinuousConvMode    = ENABLE;   // 连续转换
    hadc1.Init.DiscontinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConv      = ADC_SOFTWARE_START;
    hadc1.Init.DataAlign             = ADC_DATAALIGN_RIGHT;
    hadc1.Init.NbrOfConversion       = 1;
    hadc1.Init.DMAContinuousRequests = DISABLE;
    hadc1.Init.EOCSelection          = ADC_EOC_SINGLE_CONV;
    HAL_ADC_Init(&hadc1);
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_ADC1_Init();
    MX_USART2_UART_Init();

    // 启动 ADC 校准（提高精度）
    HAL_ADCEx_Calibration_Start(&hadc1);

    // 启动连续转换
    HAL_ADC_Start(&hadc1);

    uint32_t adc_value;
    float voltage;
    char msg[64];

    while (1)
    {
        // 等待转换完成
        if (HAL_ADC_PollForConversion(&hadc1, 100) == HAL_OK)
        {
            adc_value = HAL_ADC_GetValue(&hadc1);
            voltage   = adc_value * 3.3f / 4095.0f;

            sprintf(msg, "ADC: %lu, Voltage: %.2f V\r\n",
                    (unsigned long)adc_value, voltage);
            HAL_UART_Transmit(&huart2, (uint8_t *)msg, strlen(msg), 100);
        }

        HAL_Delay(500);
    }
}
```

### 代码逐行说明

- `ADC_RESOLUTION_12B` — 12 位精度，返回值 0-4095
- `ContinuousConvMode = ENABLE` — 连续转换模式：ADC 自动不停采样，不需要每次都手动触发
- `HAL_ADCEx_Calibration_Start()` — 校准 ADC（补偿内部偏移）。不做也行，但做了精度更好
- `HAL_ADC_PollForConversion()` — 轮询等待转换完成。因为开了连续模式，它几乎总是立即返回
- `HAL_ADC_GetValue()` — 读取转换结果寄存器
- `adc_value * 3.3f / 4095.0f` — 将 ADC 原始值换算成电压。12 位 ADC 把 3.3V 分为 4096 份

### 预期现象

旋转电位器，串口输出的电压值在 0V 到 3.3V 之间变化。

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| ADC 初始化多次调用 | 卡死在 HAL_ADC_Init | 只在程序开始的时候初始化一次 |
| 电位器接错了 | 读数一直满量程或一直 0 | 确认中间抽头接 PA0，两端接 VCC 和 GND |
| 电压不准 | 读数偏高或偏低 | 校准函数要在 ADC 启动前调用，且 VREF 引脚必须接稳定的 3.3V |

---

## 第 9 课：FreeRTOS 双任务

### 目标

在 STM32 上移植 FreeRTOS，创建两个任务：一个让 LED 以 1Hz 闪烁，一个通过串口每秒打印 "Hello from Task2"。

### 原理

FreeRTOS 是一个抢占式实时操作系统内核。任务基于优先级调度：高优先级的任务就绪时，会打断正在运行的低优先级任务。

上下文切换是由 SysTick 定时器（通常 1ms 或 10ms 一个 tick）触发的 PendSV 中断完成的。

### 接线

不需要额外接线。使用板载 LED（PA5）和 UART2（串口打印）。

### 代码

```c
#include "FreeRTOS.h"
#include "task.h"
#include "main.h"

// 任务栈大小和优先级
#define TASK_LED_STACK_SIZE  128
#define TASK_LED_PRIORITY    1
#define TASK_PRINT_STACK_SIZE 256
#define TASK_PRINT_PRIORITY   1

// 任务句柄
TaskHandle_t led_task_handle = NULL;
TaskHandle_t print_task_handle = NULL;

void LED_Task(void *argument)
{
    while (1)
    {
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);  // 翻转 LED
        vTaskDelay(pdMS_TO_TICKS(500));          // 延时 500ms
    }
}

void Print_Task(void *argument)
{
    const char *msg = "Hello from Task2\r\n";
    while (1)
    {
        HAL_UART_Transmit(&huart2, (uint8_t *)msg, strlen(msg), 100);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_USART2_UART_Init();

    // 创建两个任务
    xTaskCreate(LED_Task, "LED", TASK_LED_STACK_SIZE, NULL,
                TASK_LED_PRIORITY, &led_task_handle);
    xTaskCreate(Print_Task, "Print", TASK_PRINT_STACK_SIZE, NULL,
                TASK_PRINT_PRIORITY, &print_task_handle);

    // 启动 FreeRTOS 调度器
    vTaskStartScheduler();

    // 如果调度器启动失败，会走到这里
    while (1);
}
```

### 代码逐行说明

- `xTaskCreate()` — 创建一个任务。参数：函数指针、名字、栈大小（单位 word，不是 byte）、参数、优先级、句柄
- `vTaskDelay()` — 任务延时。当前任务进入阻塞状态，释放 CPU 给其他任务。参数是 tick 数，用 `pdMS_TO_TICKS(ms)` 将毫秒转成 tick
- `vTaskStartScheduler()` — 启动调度器。调度器启动后，FreeRTOS 接管 SysTick 和 PendSV 中断，按优先级分配 CPU 时间
- 两个任务优先级相同（都是 1）→ 时间片轮转调度。每个任务运行一个时间片（通常是 1 tick）后切换到另一个
- `pdMS_TO_TICKS()` — 将毫秒转换成 tick 数。默认 tick 频率是 1000Hz（1ms/tick），所以 `pdMS_TO_TICKS(500)` = 500 ticks

### 在 CubeIDE 中启用 FreeRTOS

1. Pinout & Configuration → Middleware → FREERTOS → Mode 选 **CMSIS_V2**
2. Configuration → Tasks → 添加两个任务：LedTask 和 PrintTask
3. 自动生成的代码会包含 FreeRTOS 的头文件和初始化
4. 代码写在 `void StartLedTask(void *argument)` 和 `void StartPrintTask(void *argument)` 中

### 预期现象

- LED 以 1Hz 闪烁（500ms 亮，500ms 灭）
- 串口每秒打印一次 "Hello from Task2"
- 两个任务互相不阻塞

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| vTaskDelay 传了 0 | 任务不释放 CPU | 延时至少 1 tick。传 0 等同于 yield（让出当前时间片但不阻塞） |
| 栈大小不够 | 任务运行后 HardFault | FreeRTOS 默认配置下，任务栈至少 128 word（512 bytes）。Print 任务因为有 printf 要更多栈，用 256 |
| 忘记配置 SysTick | FreeRTOS 不运行（一直卡在 vTaskStartScheduler） | CubeMX 的 SYS → Timebase Source 不能是 SysTick（因为被 FreeRTOS 占用了），改成 TIM6 或 TIM7 |
| 优先级反转 | 高优先级任务响应延迟 | 使用互斥量（xSemaphoreCreateMutex）而不是二元信号量。互斥量有优先级继承机制 |

---

## 第 10 课：看门狗——让死机自愈

### 目标

启用独立看门狗（IWDG），让 LED 按一定频率闪烁。故意卡死程序，观察 MCU 自动复位。

### 原理

独立看门狗（IWDG）是一个由独立 RC 振荡器驱动的硬件定时器。它不依赖主时钟，即使主时钟挂了，IWDG 仍在计数。

一旦启动，IWDG 从预设值开始递减计数。计数到 0 时，产生系统复位。程序必须在超时前"喂狗"（重装载计数器），否则 MCU 自动重启。

### 接线

不需要额外接线。

### 代码

```c
#include "main.h"

IWDG_HandleTypeDef hiwdg;

void MX_IWDG_Init(void)
{
    hiwdg.Instance       = IWDG;
    hiwdg.Init.Prescaler = IWDG_PRESCALER_64;   // 40kHz / 64 = 625Hz
    hiwdg.Init.Reload    = 1250;                 // 1250 / 625 = 2 秒超时
    HAL_IWDG_Init(&hiwdg);
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_IWDG_Init();  // 启动看门狗，2 秒超时

    uint32_t count = 0;

    while (1)
    {
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);  // 翻转 LED
        count++;

        if (count < 5)
        {
            // 前 5 次正常喂狗
            HAL_IWDG_Refresh(&hiwdg);  // 喂狗：重置计数器
            HAL_Delay(1000);           // 延时 1 秒，在超时范围内
        }
        else
        {
            // 故意不喂狗，等 3 秒 → IWDG 超时 → MCU 复位
            // 此时 LED 会保持当前状态不动
            HAL_Delay(3000);  // 延时 3 秒，超过 2 秒的看门狗超时
            // 代码不会执行到这里，因为 MCU 已经复位了
        }
    }
}
```

### 代码逐行说明

- `IWDG_PRESCALER_64` — 预分频器 64。IWDG 的时钟源是 LSI（低速内部振荡器），约 40kHz。分频后 = 40kHz / 64 ≈ 625Hz，每个 tick 约 1.6ms
- `Reload = 1250` — 重装载值。超时时间 = 1250 / 625 = 2 秒。两秒内不喂狗就复位
- `HAL_IWDG_Refresh()` — 喂狗：把重装载值写入计数器，重新开始倒计时
- 程序运行逻辑：前 5 次循环，每 1 秒喂一次狗（在 2 秒超时内），LED 正常闪烁。第 6 次循环，不喂狗且延时 3 秒 → IWDG 超时 → MCU 复位 → 程序从头开始

### 预期现象

1. LED 以 1Hz 闪烁 5 次
2. 然后 LED 停在当前状态约 2 秒
3. MCU 复位，LED 重新开始闪烁（从第 1 次开始）
4. 串口不会输出任何内容（复位后重新运行 main 开头，但本课没有配串口输出）

### 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| 喂狗太晚 | 看门狗总复位，设备不停重启 | 确保喂狗间隔小于 IWDG 的超时时间——留 50% 余量 |
| 忘记喂狗 | 设备间歇性重启 | 在任务主循环里喂狗，不要在中断里喂狗（中断里喂狗 → 主循环卡死了但中断还在跑 → 看门狗不触发） |
| Prescaler 计算错了 | 超时时间不对 | IWDG 的时钟是 LSI（~40kHz），不是 HSI/HSE。不同芯片的 LSI 频率可能有 ±10% 偏差 |

---

## 第 11 课：综合项目——蓝牙温湿度计

### 目标

组合前面所学的全部知识，做一个完整的嵌入式产品原型：通过蓝牙透传模块发送温湿度数据到手机。

### 功能清单

1. 读取 SHT30 传感器的温度 + 湿度
2. OLED 屏幕实时显示温湿度值
3. 通过 UART 连接蓝牙透传模块，将数据发送到手机
4. LED 指示工作状态（1Hz 正常，5Hz 传感器错误）
5. 使用 FreeRTOS 组织：传感器任务、显示任务、蓝牙任务

### 接线

```
Nucleo F103RB        外设
PA9  (SCL)     ──── SHT30 SCL
PA10 (SDA)     ──── SHT30 SDA
PA5  (SCK)     ──── OLED SCK
PA7  (MOSI)    ──── OLED MOSI
PA4  (CS)      ──── OLED CS
PA3  (DC)      ──── OLED DC
PA2  (RST)     ──── OLED RST
PA0  (TX)      ──── 蓝牙模块 RX
PA1  (RX)      ──── 蓝牙模块 TX
PA5            ──── LED（板载）
```

蓝牙模块（如 HC-05/HC-06）：波特率 9600，用 UART1（PA9/PA10 可能冲突，建议改接 UART3 PB10/PB11，或用 UART1 的 PA9/PA10 但注意不能和 I2C 共用）。

**实际连线需要调整引脚分配，确保没有引脚冲突。以下是推荐的不冲突方案：**

```
I2C1:  PB6 (SCL), PB7 (SDA)    → SHT30
SPI1:  PA5 (SCK), PA7 (MOSI)   → OLED
UART2: PA2 (TX),  PA3 (RX)     → 串口调试
UART3: PB10(TX),  PB11(RX)     → 蓝牙模块
LED:   PA5                      → 板载（和 SPI SCK 共用？需要查引脚的 AF 复用）
```

**⚠️ 引脚冲突检查**：PA5 既是 SPI1_SCK 又是 LED 的 GPIO 引脚，不能同时用作两个功能。建议用板载的 PC13 LED 或用额外的 LED 接 PB0。

**建议使用 Nucleo-64 的 Arduino 排针布局**，尽量避免引脚冲突。

### 代码结构

```
main.c
├── Hardware Init (GPIO, I2C, SPI, UART3, ADC)
├── FreeRTOS Tasks
│   ├── Sensor_Task    (读取 SHT30, 每 2 秒)
│   ├── Display_Task   (更新 OLED, 每 1 秒)
│   ├── BLE_Task       (发送数据, 每 2 秒)
│   └── LED_Task       (指示状态, 1Hz)
├── Data Exchange (全局结构体 + 互斥量)
└── Error Handling (看门狗 + 状态码)
```

**核心数据结构：**

```c
typedef struct {
    float temperature;
    float humidity;
    uint8_t sensor_ok;      // 传感器是否正常
    uint8_t ble_connected;  // 蓝牙是否连接
    uint32_t uptime_sec;    // 运行时间（秒）
} SystemData;

// 用互斥量保护共享数据
SystemData sys_data;
SemaphoreHandle_t data_mutex;
```

**传感器任务伪代码：**

```c
void Sensor_Task(void *arg)
{
    while (1)
    {
        // 读取 SHT30
        uint8_t ok = read_sht30(&temp, &hum);

        // 加锁更新全局数据
        xSemaphoreTake(data_mutex, portMAX_DELAY);
        sys_data.temperature = temp;
        sys_data.humidity    = hum;
        sys_data.sensor_ok   = ok;
        sys_data.uptime_sec += 2;
        xSemaphoreGive(data_mutex);

        // 传感器错误时 LED 快闪
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
```

### 完整代码

各模块的详细代码复用前面 10 课的内容，这里不重复列出。核心思路是：
- `Sensor_Task` — 参考第 6 课 I2C 代码
- `Display_Task` — 参考第 7 课 OLED 代码
- `BLE_Task` — 参考第 5 课 UART 代码，用蓝牙的 UART 替代串口线
- `LED_Task` — 参考第 4 课 PWM 代码
- 任务间通信 — 参考第 9 课 FreeRTOS 的互斥量

### 手机端查看数据

1. 手机打开蓝牙串口助手 App（如 "Serial Bluetooth Terminal"）
2. 搜索并连接 "HC-05" 或 "HC-06"
3. 每 2 秒收到一条：
```
T:25.4 H:58.2
T:25.5 H:58.0
...
```

### 常见坑

| 坑 | 解决 |
|----|------|
| 引脚冲突 | 画接线表的时候就要检查每个引脚是否只用了一个功能。STM32 参考手册有 Pinout 表 |
| 蓝牙模块波特率不对 | HC-05 默认 9600，HC-06 默认 9600，有些模块可能出厂设置不一样。用 AT 命令检查 |
| 蓝牙模块电压 | 大部分蓝牙模块是 3.3V，接到 Nucleo 的 3.3V 和 GND |
| 全局数据竞争 | 所有对 sys_data 的读写都要上锁。读也要上锁——否则可能在写了一半的时候读到脏数据 |

---

## 附录 A：工具速查

### 串口调试助手

| 工具 | 平台 | 推荐理由 |
|------|------|---------|
| TeraTerm | Windows | 免费，支持串口 + SSH，编码处理较好 |
| Putty | Windows | 轻量，但中文支持一般 |
| CoolTerm | Windows/Mac | 适合初学者，界面直观 |
| Screen | Linux/Mac | 终端版：`screen /dev/ttyACM0 115200` |

### 逻辑分析仪使用

- 硬件：Saleae Logic 克隆版（约 30 元，8 通道）
- 软件：PulseView（开源）或 Saleae Logic（原厂软件，限制 2 通道但够用）
- 典型用法：抓 UART 的一帧数据，看起始位、数据位、停止位是否正确

### 参考链接

- [STM32F103 Reference Manual (RM0008)](https://www.st.com/resource/en/reference_manual/rm0008.pdf) — 最重要的文档，比任何教程都全
- [FreeRTOS 官方文档](https://www.freertos.org/Documentation/RTOS_book.html) — 任务、队列、信号量的详细说明
- [SSD1306 DataSheet](https://www.displayfuture.com/Display/datasheet/controller/SSD1306.pdf) — OLED 驱动芯片手册
- [SHT30 Datasheet](https://www.sensirion.com/media/documents/213E6A3B/61644E5C/SHT3x_Datasheet_digital.pdf)

---

## 附录 B：STM32CubeIDE 常见问题处理

| 问题 | 解决方法 |
|------|---------|
| 编译报错 "undefined reference to" | Project → Properties → C/C++ Build → Settings → MCU GCC Linker → Libraries，检查库路径和库名 |
| 下载时报 "No ST-LINK detected" | 检查 USB 线，确认安装了 ST-LINK 驱动，尝试重新插拔 |
| 程序下载后不运行 | 检查 Debug Configuration → Reset mode 是否选了 "Software system reset" 或 "Hardware reset" |
| 代码修改后重新生成 | CubeMX 只在 .ioc 文件保存时才重新生成代码。手动保存 .ioc 或在 CubeIDE 中双击 .ioc 文件 |

---

> **做完这 11 课，你已经不是一个嵌入式小白了。**
> 你走过了 GPIO、中断、定时器、PWM、UART、I2C、SPI、ADC、RTOS、看门狗——这是嵌入式开发的全部基础面。再往后，就是挑一个方向深挖（电机控制、音频处理、无线通信协议栈、RTOS 内核源码），那已经不是入门，而是进阶了。
