# GitHub Copilot Agents / GitHub Copilot 代理

This directory contains custom GitHub Copilot agents configured for the Stellarsis project.

本目录包含为 Stellarsis 项目配置的自定义 GitHub Copilot 代理。

## Available Agents / 可用代理

### 📚 Documentation Auto-Updater (doc-updater)

**Purpose / 用途**: Automatically keeps project documentation synchronized with code changes.

**Configuration File / 配置文件**: `doc-updater.yml`

**Responsibilities / 职责**:
- Monitors code changes in backend and frontend files
- Updates relevant documentation files when code changes
- Maintains bilingual (Chinese/English) documentation
- Ensures code examples stay up-to-date
- Validates cross-references between documents

**Usage / 使用方法**:

1. **In GitHub Copilot Chat / 在 GitHub Copilot 聊天中**:
   ```
   @doc-updater review recent changes and update documentation
   ```

2. **When making code changes / 进行代码更改时**:
   ```
   @doc-updater I just added a new API endpoint, please update the docs
   ```

3. **For verification / 验证时**:
   ```
   @doc-updater check if documentation is synchronized with code
   ```

**Conversation Starters / 对话启动器**:
- "Review recent changes and update documentation"
- "Check if documentation is synchronized with code"
- "Update API documentation for latest changes"
- "Verify all code examples in documentation"
- "检查文档是否与代码同步"
- "更新最新更改的文档"

## How Copilot Agents Work / Copilot 代理工作原理

GitHub Copilot agents are specialized AI assistants configured with specific instructions for particular tasks. They:

1. **Follow Specific Instructions / 遵循特定指令**: Each agent has detailed instructions in its YAML file
2. **Context-Aware / 上下文感知**: They understand the project structure and documentation layout
3. **Automated Workflows / 自动化工作流程**: They can perform multi-step tasks automatically
4. **Quality Standards / 质量标准**: They maintain consistent quality across all updates

## Adding New Agents / 添加新代理

To create a new agent:

1. Create a new YAML file in this directory
2. Define the agent's name, description, and instructions
3. Specify the model and temperature
4. Add conversation starters

Example structure:

```yaml
name: my-agent
description: |
  Description of what this agent does
  
instructions: |
  Detailed instructions for the agent
  
conversation_starters:
  - "Example starter 1"
  - "Example starter 2"

model: claude-3.5-sonnet
temperature: 0.3
```

## Documentation File Structure / 文档文件结构

The doc-updater agent maintains the following documentation structure:

```
docs/
├── README.md                       # Documentation center
├── backend/
│   ├── ARCHITECTURE.md            # Backend architecture
│   ├── DATABASE.md                # Database models
│   ├── API.md                     # API endpoints
│   └── LOGGING.md                 # Logging system
├── frontend/
│   ├── ARCHITECTURE.md            # Frontend architecture
│   ├── COMPONENTS.md              # UI components
│   ├── THEMING.md                 # Theme system
│   └── COMMAND_PALETTE.md         # Command palette
└── guides/
    ├── QUICK_START.md             # Quick start guide
    ├── DEPLOYMENT.md              # Deployment guide
    └── CONTRIBUTING.md            # Contributing guide
```

## Code-to-Documentation Mapping / 代码到文档映射

| Code File | Documentation File | What to Update |
|-----------|-------------------|----------------|
| `app.py` (routes) | `docs/backend/API.md` | API endpoints |
| `app.py` (models) | `docs/backend/DATABASE.md` | Database schemas |
| `logger_utils.py` | `docs/backend/LOGGING.md` | Logging system |
| `config.py` | `docs/guides/DEPLOYMENT.md` | Configuration |
| `static/spa/*.js` | `docs/frontend/COMPONENTS.md` | Components |
| `static/spa/app.css` | `docs/frontend/THEMING.md` | Styles |

## Best Practices / 最佳实践

### For Documentation Updates / 文档更新

1. **Keep It Bilingual / 保持双语**: Always maintain both Chinese and English
2. **Update Examples / 更新示例**: Ensure code examples match actual implementation
3. **Cross-Reference / 交叉引用**: Update links when file structure changes
4. **Version Control / 版本控制**: Update version numbers and timestamps

### For Agent Usage / 代理使用

1. **Be Specific / 具体明确**: Clearly describe what you changed
2. **Review Changes / 检查更改**: Always review agent-made changes before committing
3. **Provide Context / 提供上下文**: Give the agent information about your changes
4. **Iterative Updates / 迭代更新**: For large changes, update docs incrementally

## Troubleshooting / 故障排查

### Agent Not Responding / 代理无响应

- Check that you're using the correct agent name with `@`
- Ensure the YAML file is properly formatted
- Verify the agent file is in `.github/agents/`

### Incorrect Updates / 更新不正确

- Provide more context about the code changes
- Be specific about which documentation sections need updates
- Review and manually adjust if needed

### Missing Documentation / 文档缺失

- Check the file mapping table above
- Ensure all relevant documentation files exist
- Create new sections if needed for new features

## Future Enhancements / 未来增强

Potential improvements for agents:

- **Automated Testing / 自动化测试**: Verify code examples actually work
- **Link Validation / 链接验证**: Check all internal and external links
- **Version Tracking / 版本跟踪**: Automatically update version numbers
- **Change Logs / 变更日志**: Generate changelog entries automatically
- **Translation Sync / 翻译同步**: Ensure Chinese and English are consistent

## References / 参考资料

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Project Documentation](../docs/README.md)
- [Contributing Guide](../docs/guides/CONTRIBUTING.md)

---

**Last Updated / 最后更新**: 2026-02-10
