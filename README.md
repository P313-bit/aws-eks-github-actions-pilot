# AWS EKS GitHub Actions CI/CD Pilot

An end-to-end DevOps learning project demonstrating containerization, AWS infrastructure, Kubernetes deployment, GitHub Actions CI, and Argo CD GitOps delivery.

## 1. Project Overview

This project deploys a Node.js REST API to Amazon EKS.

Current implementation:
- Node.js and Express REST API
- Docker containerization
- Amazon ECR image repository
- GitHub Actions CI pipeline
- AWS IAM OIDC authentication
- GitOps manifest updates using GitHub Actions
- Argo CD application reconciliation
- Amazon EKS managed node group
- Kubernetes Deployment and ClusterIP Service
- Application health and readiness probes
- Two application replicas across separate worker nodes

This is a production-inspired learning pilot, not a production-ready reference architecture.

## 2. Architecture

### Current CI/CD and GitOps architecture

```text
Developer
   |
   v
GitHub Repository (main)
   |
   v
GitHub Actions - Build and Push
(GitHub-hosted Ubuntu runner)
   |
   | GitHub OIDC
   v
AWS IAM - ECR Push Role
   |
   v
Docker Build
   |
   v
Amazon ECR
   |
   v
GitHub Actions - Update GitOps Manifest
(GitHub-hosted Ubuntu runner)
   |
   | Commit updated image tag
   v
GitOps Repository
(Kustomize manifest)
   |
   v
Argo CD
(Manual synchronization)
   |
   v
Amazon EKS
   |
   v
Kubernetes Deployment
   |
   v
Node.js API Pods (2 replicas)
   |
   v
Kubernetes ClusterIP Service
```

### Deployment workflow

1. A source-code change is pushed to the `main` branch.
2. GitHub Actions builds the Docker image.
3. GitHub Actions authenticates to AWS using OIDC.
4. The image is pushed to Amazon ECR with an immutable version tag.
5. A separate GitHub Actions job updates the Kustomize image tag.
6. The updated manifest is committed to the GitHub repository.
7. Argo CD detects the repository revision.
8. An operator manually synchronizes the Argo CD application.
9. Argo CD applies the desired state to the EKS cluster.
10. Kubernetes performs the Deployment rollout.

**Important:** Argo CD automated sync, self-healing, and pruning are not enabled. A manual sync is required after a new GitOps manifest commit.

## 3. Technology Stack

| Category | Technology |
|---|---|
| Cloud | AWS |
| Containerization | Docker |
| Container Registry | Amazon ECR |
| Orchestration | Kubernetes |
| Managed Kubernetes | Amazon EKS |
| CI/CD | GitHub Actions |
| GitOps | Argo CD |
| Manifest Management | Kustomize |
| Authentication | AWS IAM OIDC |
| Infrastructure CLI | AWS CLI, kubectl, eksctl |
| Application | Node.js, Express |
| Operating System | Ubuntu 24.04 |

## 4. AWS Environment

| Resource | Configuration |
|---|---|
| AWS Region | ap-south-1 (Mumbai) |
| EKS Cluster | devops-pilot-eks |
| Kubernetes Version | 1.37.1 |
| Namespace | dev |
| Worker Nodes | 2 |
| Instance Type | t3.medium |
| Worker Node Group | Managed |
| ECR Repository | eks-pilot-api |
| ECR Image Scanning | Scan on push |
| ECR Tag Mutability | Immutable |
| Argo CD Version | v3.6.2 |

The cluster uses a dedicated VPC, public and private subnets, and a NAT Gateway. Worker nodes are deployed in private subnets.

## 5. Application Details

The project contains a Node.js REST API built with Express.

| Endpoint | Purpose |
|---|---|
| `/` | Application information |
| `/health` | Health check |
| `/ready` | Readiness check |

Application port: `3000`

The Docker image uses a non-root container user and installs production dependencies.

## 6. Kubernetes Configuration

| Setting | Value |
|---|---|
| Namespace | dev |
| Deployment | eks-pilot-api |
| Service | eks-pilot-api |
| Service type | ClusterIP |
| Replicas | 2 |
| Container port | 3000 |

The Deployment includes:
- Startup probe
- Readiness probe
- Liveness probe
- CPU and memory requests
- CPU and memory limits

The latest rollout was verified with both replicas Running and Ready on separate worker nodes.

## 7. GitHub Actions CI/CD Pipeline

Workflow file:

`.github/workflows/build-and-push.yml`

The workflow uses two GitHub-hosted Ubuntu jobs.

### Job 1 — Build and Push Docker Image

1. Checkout source code.
2. Authenticate to AWS using GitHub OIDC.
3. Log in to Amazon ECR.
4. Configure Docker Buildx.
5. Build the Docker image.
6. Push the versioned image to Amazon ECR.

### Job 2 — Update GitOps Image Tag

1. Runs after the image build and push job succeeds.
2. Checks out the repository using the GitHub token.
3. Updates the image tag in `gitops/dev/eks-pilot-api/kustomization.yaml`.
4. Commits and pushes the updated GitOps manifest to `main`.

Image tags use the Git commit SHA and GitHub run attempt.

No permanent AWS access keys are stored in GitHub Actions.

### IAM roles

| IAM role | Purpose |
|---|---|
| `GitHubActionsECRPushRole` | Authenticate with Amazon ECR and push application images |
| `GitHubActionsEKSDeployRole` | Legacy direct EKS deployment access; retained pending review and cleanup |

The current GitHub Actions workflow uses the ECR push role. The GitOps manifest update job uses GitHub repository permissions and does not directly deploy to EKS.

The legacy EKS deployment role and its namespace-scoped RBAC are not used by the current GitOps deployment workflow.

## 8. GitOps Configuration

Argo CD v3.6.2 is installed in the `argocd` namespace.

| Setting | Value |
|---|---|
| Application | eks-pilot-api-dev |
| Source repository | P313-bit/aws-eks-github-actions-pilot |
| Branch | main |
| Manifest path | gitops/dev/eks-pilot-api |
| Destination | Kubernetes in-cluster API |
| Destination namespace | dev |
| Manifest format | Kustomize |
| Sync policy | Manual |

Important repository files:

- `argocd/application.yaml`
- `gitops/dev/eks-pilot-api/api-deployment.yaml`
- `gitops/dev/eks-pilot-api/api-service.yaml`
- `gitops/dev/eks-pilot-api/kustomization.yaml`

The Kustomize image transformer updates the Deployment image using the tag committed by GitHub Actions.

### Latest verified GitOps deployment

| Check | Result |
|---|---|
| GitHub Actions build and ECR push | Successful |
| GitOps manifest update | Successful |
| GitOps commit | `f55b4af` |
| Argo CD sync operation | Succeeded |
| Argo CD sync status | Synced |
| Argo CD health | Healthy |
| Deployment rollout | Successful |
| Ready replicas | 2/2 |
| Pod status | Running |
| Pod restarts | 0 |
| Worker-node placement | Two separate nodes |

Latest deployed image tag:

`326e94d27f8a0d3b1fb623077b76bc3a1fe65cff-1`

ECR image:

`750281913869.dkr.ecr.ap-south-1.amazonaws.com/eks-pilot-api`

The latest deployment was synchronized from Git commit `f55b4af6b9be1409995fee3cea0645bace47eafa`.

The Argo CD application is configured for manual synchronization. The initial Argo CD adoption added tracking annotations to the existing Service and Deployment. The subsequent GitOps sync deployed the new image version and the rollout was verified successfully.

Automated sync, self-healing, and pruning remain disabled.

## 9. Repository Structure

```text
aws-eks-github-actions-pilot/
├── .github/
│   └── workflows/
│       └── build-and-push.yml
├── app/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── argocd/
│   └── application.yaml
├── gitops/
│   └── dev/
│       └── eks-pilot-api/
│           ├── api-deployment.yaml
│           ├── api-service.yaml
│           └── kustomization.yaml
├── k8s/
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   └── rbac-deployer.yaml
├── .gitignore
└── README.md
```

IAM policy files used for AWS configuration are maintained separately and are not included in the application repository.

## 10. Project Progress

| Milestone | Status |
|---|---|
| GitHub repository setup | Completed |
| Node.js API development | Completed |
| Docker image build | Completed |
| Amazon ECR repository | Completed |
| GitHub Actions CI workflow | Completed |
| GitHub OIDC authentication | Completed |
| EKS cluster provisioning | Completed |
| Kubernetes Deployment and Service | Completed |
| Application health endpoint testing | Completed; HTTP 200 verified for /, /health, and /ready |
| Kubernetes Service connectivity testing | Completed; ClusterIP Service and both EndpointSlice backends verified |
| Kubernetes Deployment self-healing test | Completed; deleted Pod automatically replaced and 2/2 replicas restored |
| Kubernetes container restart test | Completed; liveness probe failure triggered container restarts, probe restored, and 2/2 healthy replicas verified |
| Temporary test Pod cleanup | Completed |
| Self-hosted GitHub Actions runner setup | Completed |
| Dedicated EKS deployment IAM role and RBAC | Completed; legacy |
| Argo CD v3.6.2 installation | Completed |
| Argo CD Application and Kustomize manifests | Completed |
| GitHub Actions GitOps image update | Completed and verified |
| Argo CD manual synchronization | Completed and verified |
| Latest EKS rollout verification | Completed |
| Automated Argo CD sync | Enabled and verified; Git commit automatically synchronized the Kubernetes Service annotation |
| Monitoring and observability | Planned |
| Further security and resilience improvements | Planned |

### Kubernetes container restart test

The API container restart behavior was tested by temporarily changing the Deployment liveness probe endpoint from `/health` to `/health-test`.

- The temporary endpoint returned an unsuccessful health check.
- Kubernetes detected the liveness probe failures and restarted both API containers.
- The liveness probe endpoint was restored to `/health`.
- The Deployment rollout completed successfully after restoration.
- Final verification confirmed two Running and Ready API Pods, with 2/2 replicas available and zero restarts on the replacement Pods.
- Argo CD reported the application as Synced and Healthy after the original configuration was restored.

This test verified Kubernetes container recovery through liveness probes. The temporary probe change was applied directly to the live Deployment and was not retained in Git.

### Argo CD automated synchronization test

Automated synchronization was enabled on the `eks-pilot-api-dev` Application with self-healing and pruning disabled.

- Automated sync was configured in `argocd/application.yaml`.
- `selfHeal: false` and `prune: false` were retained.
- A test annotation, `learning-test: argocd-automated-sync`, was added to the Kubernetes Service manifest.
- The change was committed and pushed to Git at commit `e247290`.
- Argo CD detected the Git change and synchronized the Service automatically without a manual sync command.
- The live Service annotation was verified successfully.
- Argo CD reported the application as Synced and Healthy.
- The Deployment remained available with 2/2 replicas, and both API Pods remained Running and Ready with zero restarts.

This test verified automated Git-to-cluster synchronization for a metadata-only change. Self-healing and pruning were not enabled or tested.

## 11. Next Implementation Steps

1. Enable and test Argo CD self-healing separately; keep pruning disabled.
2. Add monitoring and observability.
3. Improve Kubernetes security, resource management, and resilience.
4. Review and remove legacy EKS deployment IAM permissions and RBAC when no longer required.
5. Expand architecture, troubleshooting, and cleanup documentation.

## 12. Cost and Cleanup Considerations

This learning environment uses billable AWS resources, including:

- Amazon EKS cluster control plane
- EC2 worker nodes
- NAT Gateway and data processing
- EBS volumes
- Amazon ECR storage and data transfer

Review AWS costs regularly. When the project is not in use, clean up resources according to the dependency-aware cleanup plan.

Do not delete the EKS cluster or networking resources before checking dependent resources and persistent data.

## 13. Repository

GitHub:

https://github.com/P313-bit/aws-eks-github-actions-pilot

---

**Project status:** GitHub Actions image build, ECR push, GitOps manifest update, Argo CD manual sync, and EKS rollout successfully verified.

## 14. Self-Hosted GitHub Actions Runner

A self-hosted GitHub Actions runner was configured on an existing Ubuntu EC2 instance to support the earlier direct EKS deployment workflow and cluster administration.

It is retained as infrastructure for the pilot, but the current image build and GitOps manifest update jobs use GitHub-hosted runners.

### Runner Configuration

| Setting | Value |
|---|---|
| Runner name | `eks-deployment-runner` |
| Runner group | `Default` |
| Platform | Linux x64 |
| Labels | `self-hosted`, `Linux`, `X64`, `eks-deploy` |
| Linux service account | `github-runner` |
| Installation directory | `/opt/actions-runner` |
| Work directory | `_work` |
| Runner version | `2.338.2` |
| Service manager | systemd |

### Runner Security

- The runner operates under a dedicated Linux account named `github-runner`.
- The account is not a member of the `sudo` or `docker` groups.
- The runner is installed as a systemd service.
- The runner account has no EC2 instance profile credentials.
- The earlier deployment workflow used GitHub OIDC for temporary AWS credentials.
- The EKS public API endpoint is restricted to the configured EC2 public IP.

### Network Connectivity Verification

| Check | Verified value |
|---|---|
| Self-hosted runner EC2 region | `us-east-2` |
| EKS cluster region | `ap-south-1` |
| EC2 outbound public IP | `18.118.253.128` |
| EKS public API allowed CIDR | `18.118.253.128/32` |
| Network allowlist match | Confirmed |

The EC2 runner's outbound public IP matches the EKS API allowlist. The EKS public endpoint is not open to all internet addresses.

### Legacy GitHub OIDC EKS Deployment Access

The following configuration was created for the earlier direct deployment workflow.

| Component | Configuration |
|---|---|
| IAM role | `GitHubActionsEKSDeployRole` |
| IAM policy | `GitHubActionsEKSDeployPolicy` |
| AWS permission | `eks:DescribeCluster` |
| EKS cluster | `devops-pilot-eks` |
| EKS region | `ap-south-1` |
| Authentication | GitHub Actions OIDC |
| Trusted repository | `P313-bit/aws-eks-github-actions-pilot` |
| Trusted branch | `main` |

The role was registered with the EKS cluster through an EKS access entry and assigned to the Kubernetes group `github-actions-deployer`.

This role is retained for review and cleanup. It is not used by the current GitOps deployment workflow.

### Legacy Namespace-Scoped Kubernetes RBAC

The manifest `k8s/rbac-deployer.yaml` creates a Role and RoleBinding in the `dev` namespace.

| Resource | Permissions |
|---|---|
| Deployments | get, list, watch, patch |
| ReplicaSets | get, list, watch |
| Pods | get, list, watch |
| Services | get, list, watch |
| Secrets | No access |

Previous authorization checks using Kubernetes impersonation returned:

| Check | Result |
|---|---|
| Patch deployments | Allowed |
| Read pods | Allowed |
| Read secrets | Denied |

The legacy deployment role does not receive cluster-admin access or namespace-wide administrative permissions.

## Argo CD Self-Healing Test

**Status: Enabled and successfully verified**

Argo CD automated self-healing is enabled for the `eks-pilot-api-dev` Application.

Configuration in `argocd/application.yaml`:

- `selfHeal: true`
- `prune: false`

### Test procedure

1. Confirmed the Git desired replica count was 2.
2. Temporarily scaled the live Kubernetes Deployment from 2 to 3 replicas:
   `kubectl scale deployment eks-pilot-api -n dev --current-replicas=2 --replicas=3`
3. Watched Deployment changes using `kubectl get deployment --watch`.
4. Observed the desired replica count change from 2 to 3 and then return to 2.
5. Verified the final Deployment state was 2/2 replicas.
6. Verified the Argo CD Application was `Synced` and `Healthy`.

### Result

**Passed:** Argo CD detected the live replica-count drift and reconciled the Deployment back to the Git-defined state of 2 replicas.

The test was performed as a temporary live-cluster change. The Git manifest remained unchanged, and resource pruning remains disabled.
