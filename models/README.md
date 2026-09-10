# Model Weights README

The repository currently demonstrates a PyTorch checkpoint named:

`oceanembed_patch_cnn_final.pth`

This file is a local model checkpoint that contains:
- `model_state_dict`
- `features`
- `depths`
- `patch_size`
- `train_mean`
- `train_std`

The architecture recreated in the notebook is a `nn.Sequential` patch-CNN with convolution layers and ReLU activations, followed by a 1x1 convolution layer that produces 15 depth-wise outputs from a 7-feature input patch.

The model is loaded in the notebook with:

```python
checkpoint = torch.load(
    "oceanembed_patch_cnn_final.pth",
    map_location=device,
    weights_only=False
)
```

The file is currently kept locally and should not be uploaded to normal GitHub by default unless it is small enough and the user approves. If the checkpoint grows beyond the repository size limit, use Git LFS or a model-hosting service for publication.

The notebook and repository can be configured to load the model from the repository root or from a local `models/` folder by moving a copy of the file there before publication.
