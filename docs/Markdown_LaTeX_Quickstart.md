# Markdown 与 LaTeX 快速入门（简明）

以下内容用中文说明如何在 Stellarsis 的帖子/聊天中写 Markdown 与 LaTeX（适合多项式与微积分类数学表达）。

## 1) 基础 Markdown

- **段落**：直接写文本并空行分段。
- **换行（强制换行）**：在行尾添加两个空格（或直接回车两次）。
- **标题**：使用 `#`，例如 `# 一级标题`、`## 二级标题`。
- **加粗**：`**加粗文本**`。
- **斜体**：`*斜体文本*` 或 `_斜体_`。
- **列表**：
  - 无序列表：以 `- ` 或 `* ` 开头。
  - 有序列表：`1. ` `2. ` 等。
- **代码**：
  - 行内代码：使用反引号，例如 `` `x = 2` ``。
  - 代码块：使用三个反引号：
    ````markdown
    ```python
    def f(x):
        return x**2
    ```
    ````
- **插入图片**：
  - 语法： `![替代文字](/static/uploads/USER_ID/filename.png)`
  - 系统上传后会返回一段 `![alt](url)` 的 Markdown，点击复制即可粘贴进编辑器。
- **表格**：
  ````markdown
  | 项目     | 公式                | 说明          |
  |----------|---------------------|---------------|
  | 导数     | `$f'(x)$`          | 一阶导数      |
  | 积分     | `$\int_a^b f(x)dx$`| 定积分        |
  ````
- **引用块**：  
  `> **定理**：所有多项式在复数域上可因式分解。`  
- **超链接**：  
  `[Wikipedia: 多项式](https://en.wikipedia.org/wiki/Polynomial)`

## 2) LaTeX（数学公式）基础

Stellarsis 支持内联与块级 LaTeX 公式（基于常见的渲染器）：

- **行内公式**：用 `$ ... $` 包裹，例如 `$x^2 + y^2 = z^2$`。
- **块级公式**：用 `$$ ... $$` 包裹，写在单独一行，用于较大或独立的公式：
  ```latex
  $$
  \int_0^1 x^2 \,dx = \frac{1}{3}
  $$
  ```

> **提示**：在聊天短消息中尽量使用行内公式避免换行过多。

## 3) 常见多项式示例（Markdown + LaTeX）

- **多项式定义（行内）**：  
  `多项式 $p(x)=3x^3-2x+1$ 在区间 [0,1] 上的值为...`
- **展示多项式（块级）**：
  ```latex
  $$
  p(x) = 3x^3 - 2x + 1
  $$
  ```
- **因式分解（块级）**：
  ```latex
  $$
  p(x) = (x-1)(3x^2+3x-1)
  $$
  ```

### 3.5) 常用数学符号与希腊字母
- **希腊字母**：  
  `$\alpha, \beta, \gamma, \delta, \epsilon, \theta, \lambda, \mu, \pi, \sigma, \omega$` → α, β, γ, δ, ε, θ, λ, μ, π, σ, ω  
  （大写：`\Gamma` → Γ, `\Delta` → Δ, `\Sigma` → Σ）
- **关系符号**：  
  `$\leq$` (≤), `$\geq$` (≥), `$\neq$` (≠), `$\approx$` (≈), `$\in$` (∈)
- **运算符**：  
  `$\times$` (×), `$\cdot$` (·), `$\pm$` (±), `$\nabla$` (∇)
- **特殊符号**：  
  `$\infty$` (∞), `$\partial$` (∂), `$\degree$` (°)

## 4) 微积分常用输入示例

- **导数（行内）**：  
  `$f'(x) = 3x^2 - 2$` 或 `$\frac{d}{dx} f(x) = 3x^2 - 2$`
- **不定积分（块级）**：
  ```latex
  $$
  \int 3x^2 - 2 \,dx = x^3 - 2x + C
  $$
  ```
- **定积分**：
  ```latex
  $$
  \int_a^b x^2 \,dx = \left[\frac{x^3}{3}\right]_a^b = \frac{b^3-a^3}{3}
  $$
  ```

### 4.5) 高级数学结构
- **分段函数**：
  ```latex
  $$
  f(x) = 
  \begin{cases} 
      x^2 & \text{if } x \geq 0 \\
      -x^2 & \text{if } x < 0
  \end{cases}
  $$
  ```
- **矩阵**：
  ```latex
  $$
  \begin{pmatrix}
      a & b \\
      c & d
  \end{pmatrix}
  \quad \text{或} \quad
  \begin{bmatrix}
      1 & 2 \\
      3 & 4
  \end{bmatrix}
  $$
  ```
- **方程组**：
  ```latex
  $$
  \begin{cases}
      2x + y = 3 \\
      x - y = 1
  \end{cases}
  $$
  ```
- **求和/极限**：  
  行内：`$\sum_{k=1}^n k = \frac{n(n+1)}{2}$`  
  块级：
  ```latex
  $$
  \lim_{x \to 0} \frac{\sin x}{x} = 1
  $$
  ```

## 5) 小技巧与常见错误

- **间距控制**：  
  - 积分符号后手动加空格：`\int x \, dx`（使用 `\,` 小空格）  
  - 长公式用 `\quad`/`\qquad`：`$a = b \quad \text{(由定理1)}$`
- **多行公式对齐**：  
  用 `\begin{aligned}` 环境（在 `$$` 内）：
  ```latex
  $$
  \begin{aligned}
      f(x) &= (x+1)^2 \\
           &= x^2 + 2x + 1
  \end{aligned}
  $$
  ```
- **转义规则**：  
  - 公式外显示 `$`：用 `\$`（如 `价格\$5` → 价格$5）  
  - 公式内避免 `# % & _ { }`，改用 LaTeX 命令（如 `\%` 显示 %）
- **公式书写规范**：  
  - 指数多位数时：`$x^{10}$`（而非 `$x^10$`）  
  - 块级公式需独占一行（`$$...$$` 前后不能有其他字符）
- **聊天场景优化**：  
  - 长公式拆分为多个行内公式：`$L=$` + `$\lim_{x\to\infty} f(x)$`  
  - 用 `\text{}` 在公式中插入文字：`$x \text{ 是实数}$`
- **Stellarsis 限制**：  
  - 不支持 `\begin{align}`（用 `\begin{aligned}` 替代）  
  - 不支持自定义宏（如 `\newcommand`）

## 6) 完整示例（整段可复制）

````markdown
> **例**：求 $f(x)=\begin{cases} x^2 & x\geq0 \\ -x^2 & x<0 \end{cases}$ 在 $[-1,1]$ 的积分。

解：  
$$
\int_{-1}^1 f(x) \,dx = \int_{-1}^0 -x^2 \,dx + \int_0^1 x^2 \,dx = \left[ -\frac{x^3}{3} \right]_{-1}^0 + \left[ \frac{x^3}{3} \right]_0^1 = \frac{2}{3}
$$

**验证**：导数 $f'(x) = \begin{cases} 2x & x>0 \\ -2x & x<0 \end{cases}$ 在 $x=0$ 处不连续。
````

**效果预览**：  
> **例**：求 $f(x)=\begin{cases} x^2 & x\geq0 \\ -x^2 & x<0 \end{cases}$ 在 $[-1,1]$ 的积分。  

解：  
$$
\int_{-1}^1 f(x) \,dx = \int_{-1}^0 -x^2 \,dx + \int_0^1 x^2 \,dx = \left[ -\frac{x^3}{3} \right]_{-1}^0 + \left[ \frac{x^3}{3} \right]_0^1 = \frac{2}{3}
$$

**验证**：导数 $f'(x) = \begin{cases} 2x & x>0 \\ -2x & x<0 \end{cases}$ 在 $x=0$ 处不连续。

---

把上面内容粘贴到发帖编辑器即可看到 Markdown + LaTeX 渲染效果。  
**提示**：先在 [LaTeX 公式测试工具](https://www.latexlive.com/) 预览复杂公式再粘贴到 Stellarsis。