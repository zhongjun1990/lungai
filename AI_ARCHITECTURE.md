# AI 医疗影像分析 SaaS - AI 模型推理架构

## 概述

本架构设计重点解决：
- 医疗影像模型的高性能推理
- 多模型版本管理与部署
- 推理任务调度与资源优化
- 模型监控与 A/B 测试
- 合规性与可追溯性

## 推理架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              推理请求入口                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  分析服务 │ 工作流服务 │ 第三方集成                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              推理网关层                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  请求路由 │ 流量控制 │ 模型选择 │ 版本管理 │ 缓存查询 │ 监控埋点            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│  推理引擎池      │            │  模型仓库        │            │  特征工程服务    │
│  - TensorRT      │            │  - MLflow        │            │  - DICOM 解析    │
│  - ONNX Runtime  │            │  - Git LFS       │            │  - 图像预处理    │
│  - Triton        │            │  - Docker 镜像   │            │  - 标准化        │
└──────────────────┘            └──────────────────┘            └──────────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GPU 资源池                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  GPU 实例类型 │ 资源隔离 │ 自动扩缩容 │ 作业调度 │ 显存管理            │
│  - T4 (推理)  │  - CUDA   │  - KEDA    │  - Slurm │  - MPS            │
│  - A10G (高负载)│ - 容器化  │  - HPA     │          │  - 模型并行        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              推理输出处理                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  后处理 │ NMS │ 置信度过滤 │ 可视化 │ 结果存储 │ 事件通知                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              监控与反馈                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  推理延迟 │ 准确率 │ 资源使用率 │ 错误率 │ 模型漂移 │ A/B 测试              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 模型推理引擎

### 1. 推理引擎选型

| 引擎 | 优势 | 场景 |
|------|------|------|
| NVIDIA TensorRT | 高性能优化，支持 FP16/INT8 | 生产级推理 |
| ONNX Runtime | 跨平台，支持硬件加速 | 模型转换与验证 |
| NVIDIA Triton | 多模型部署，Batching，动态批量 | 多模型服务 |
| TorchServe | PyTorch 原生，支持自定义处理 | 开发/实验阶段 |

### 2. 引擎部署架构

```
Triton Inference Server
├── Model Repository (Git LFS 挂载)
│   ├── brain-tumor-detection/
│   │   ├── 1/
│   │   │   ├── model.plan (TensorRT)
│   │   │   └── config.pbtxt
│   │   ├── 2/
│   │   └── config.pbtxt (全局配置)
│   ├── lung-nodule-detection/
│   │   ├── 1/
│   │   └── config.pbtxt
│   └── fracture-detection/
├── GPUs: [0, 1, 2, 3] (多 GPU 绑定)
├── Scheduler: Dynamic Batching
└── Metrics: Prometheus 端点
```

### 3. 推理优化策略

#### 模型优化

```python
# ONNX 转换与优化
import torch
import torch.onnx
from torch2trt import torch2trt

# PyTorch → ONNX
model = MyModel()
dummy_input = torch.randn(1, 1, 512, 512).cuda()
torch.onnx.export(model, dummy_input, "model.onnx",
                  opset_version=13,
                  do_constant_folding=True)

# ONNX → TensorRT
import trtexec
trtexec.build_engine(
    input=("input", "float32:1x1x512x512"),
    output=("output"),
    onnx="model.onnx",
    fp16=True,
    workspace=4096
)

# 动态形状支持
trtexec.build_engine(
    input=("input", "float32:1x1x[256-1024]x[256-1024]"),
    output=("output"),
    onnx="model.onnx",
    fp16=True
)
```

#### 调度优化

```yaml
# Triton 模型配置
name: "brain-tumor-detection"
platform: "tensorrt_plan"
max_batch_size: 16
input [
  {
    name: "input"
    data_type: TYPE_FP32
    format: FORMAT_NCHW
    dims: [ 1, 512, 512 ]
  }
]
output [
  {
    name: "output"
    data_type: TYPE_FP32
    dims: [ 1, 3, 512, 512 ]
  }
]
dynamic_batching {
  preferred_batch_size: [ 4, 8, 16 ]
  max_queue_delay_microseconds: 5000
}
instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [ 0, 1 ]
  }
]
```

#### 显存优化

```python
import torch
import torch.nn.functional as F

# 显存优化配置
torch.backends.cudnn.benchmark = True
torch.backends.cudnn.deterministic = False

# 混合精度训练/推理
with torch.cuda.amp.autocast():
    output = model(input)

# 梯度检查点
from torch.utils.checkpoint import checkpoint
def forward_pass(x):
    return model(x)
output = checkpoint(forward_pass, input)

# 模型并行
class ParallelModel(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.part1 = torch.nn.DataParallel(model.part1)
        self.part2 = torch.nn.DataParallel(model.part2)
    def forward(self, x):
        x = self.part1(x.cuda(0))
        x = self.part2(x.cuda(1))
        return x
```

## 模型仓库与版本管理

### 1. 模型仓库架构

```
model-registry/
├── mlflow/                      # MLflow 跟踪服务器
│   ├── experiments/             # 实验记录
│   ├── runs/                    # 运行记录
│   └── artifacts/               # 模型构件
├── git-lfs/                     # Git LFS 存储
│   ├── models/
│   │   ├── v1.0.0/
│   │   │   ├── model.plan
│   │   │   ├── config.pbtxt
│   │   │   └── metadata.yaml
│   │   └── v1.1.0/
│   └── datasets/
└── docker/                      # 推理容器镜像
    ├── torchserve/
    ├── triton/
    └── base/
```

### 2. 版本管理策略

```python
from mlflow.tracking import MlflowClient
client = MlflowClient()

def register_model(model_uri, name, version):
    """注册模型版本"""
    result = client.create_model_version(
        name=name,
        source=model_uri,
        run_id=version
    )
    return result

def transition_model_stage(name, version, stage):
    """模型阶段转换"""
    client.transition_model_version_stage(
        name=name,
        version=version,
        stage=stage,
        archive_existing_versions=True
    )

# 示例：注册新版本并标记为生产
run_id = "123456"
model_uri = f"runs:/{run_id}/model"
result = register_model(model_uri, "brain-tumor-detection", run_id)
transition_model_stage("brain-tumor-detection", result.version, "Production")
```

### 3. 部署管道

```
CI/CD 管道
├── 模型训练完成
├── 生成并上传构件
├── 自动注册到 MLflow
├── 转换为 TensorRT 引擎
├── 创建 Docker 镜像
├── 安全扫描
├── 部署到 Staging 环境
├── A/B 测试
├── 生产环境 Canary 发布
└── 完整流量切换
```

## 推理任务调度

### 1. 任务调度架构

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  任务队列           │     │  调度器             │     │  执行器池           │
│  - Redis Stream     │────▶│  - KEDA + HPA       │────▶│  - Kubernetes Pods  │
│  - 优先级队列       │     │  - 基于资源的调度   │     │  - 资源请求/限制     │
│  - 限流机制         │     │  - 延迟绑定         │     │  - 自动扩缩容       │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### 2. 调度策略

```python
from kubernetes import client, config
from kubernetes.client.models import V1ResourceRequirements

config.load_kube_config()
v1 = client.CoreV1Api()

def create_inference_pod(name, model_name, gpu_type):
    """创建推理 Pod"""
    container = client.V1Container(
        name=name,
        image=f"myregistry/{model_name}:latest",
        resources=V1ResourceRequirements(
            requests={"cpu": "1", "memory": "2Gi", "nvidia.com/gpu": 1},
            limits={"cpu": "4", "memory": "8Gi", "nvidia.com/gpu": 1}
        ),
        args=["--model", model_name],
        ports=[{"container_port": 8000}]
    )
    pod_spec = client.V1PodSpec(containers=[container])
    pod = client.V1Pod(
        metadata=client.V1ObjectMeta(name=name),
        spec=pod_spec
    )
    return v1.create_namespaced_pod(namespace="inference", body=pod)
```

## 推理监控

### 1. 关键指标

```prometheus
# 推理延迟
histogram_quantile(0.95, rate(triton_inference_request_duration_seconds_bucket[5m]))

# 资源使用率
avg(container_memory_usage_bytes / container_memory_limit_bytes * 100)

# GPU 显存使用率
avg(nvidia_gpu_memory_used_bytes / nvidia_gpu_memory_total_bytes * 100)

# 错误率
rate(triton_inference_request_failure_count[5m]) / rate(triton_inference_request_count[5m])
```

### 2. 模型漂移检测

```python
def detect_model_drift(reference_distribution, current_distribution, threshold=0.1):
    """检测模型漂移"""
    from scipy.spatial.distance import jensenshannon

    js_distance = jensenshannon(reference_distribution, current_distribution)
    return js_distance > threshold

# 使用 Mahalanobis 距离检测概念漂移
def detect_concept_drift(X_train, X_test):
    from sklearn.covariance import EmpiricalCovariance

    cov = EmpiricalCovariance().fit(X_train)
    mean = X_train.mean(axis=0)

    distances = cov.mahalanobis(X_test - mean)
    threshold = np.percentile(distances, 99)

    return np.sum(distances > threshold) / len(distances) > 0.05
```

## A/B 测试框架

### 1. A/B 测试架构

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  流量路由           │     │  实验分组           │     │  数据分析           │
│  - Istio VirtualService │ - 一致性哈希          │     │  - 显著性检验       │
│  - 权重分配         │     │  - 用户属性           │     │  - 置信区间         │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### 2. 实验管理

```yaml
# Istio VirtualService
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: inference-virtualservice
spec:
  hosts: [ "inference.example.com" ]
  http:
  - route:
    - destination:
        host: brain-tumor-detection-v1
        subset: v1
      weight: 80
    - destination:
        host: brain-tumor-detection-v2
        subset: v2
      weight: 20
```

## 推理结果验证

### 1. 验证架构

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  结果存储           │     │  验证引擎           │     │  验证规则库         │
│  - PostgreSQL       │────▶│  - 规则引擎          │────▶│  - 专家知识规则     │
│  - 结果表           │     │  - 统计验证          │     │  - 阈值配置         │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### 2. 验证规则

```python
def validate_detection_result(result):
    """验证检测结果"""
    # 检查置信度
    if result.confidence < 0.7:
        return False, "Confidence too low"

    # 检查边界框有效性
    if result.bbox.width < 10 or result.bbox.height < 10:
        return False, "BBox too small"

    # 检查重叠度
    overlapping = calculate_overlap(result.bbox, result.other_bboxes)
    if overlapping > 0.8:
        return False, "Overlapping boxes"

    return True, "Valid"
```

## 合规性与审计

### 1. 推理审计

```sql
CREATE TABLE inference_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    request_id UUID NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    tenant_id UUID,
    patient_id UUID,
    study_uid VARCHAR(255),
    request_payload JSONB,
    response_payload JSONB,
    latency_ms INTEGER,
    gpu_memory_used_mb INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX ON inference_audit_logs (request_id);
CREATE INDEX ON inference_audit_logs (tenant_id, created_at);
CREATE INDEX ON inference_audit_logs (model_name, model_version);
```

### 2. 合规性检查

```python
def check_compliance(log_entry):
    """检查合规性要求"""
    # HIPAA 要求：推理结果必须与患者数据关联
    if not log_entry.patient_id:
        return False, "Missing patient identifier"

    # 审计要求：完整的请求/响应记录
    if not log_entry.request_payload or not log_entry.response_payload:
        return False, "Incomplete audit trail"

    # 响应时间 SLA
    if log_entry.latency_ms > 5000:
        return False, "Response time violation"

    return True, "Compliant"
```
