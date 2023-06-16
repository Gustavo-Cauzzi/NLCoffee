import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridPaginationModel } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers";
import { Charge } from "@shared/@types/Charge";
import { User } from "@shared/@types/User";
import { getApi } from "@shared/services/api";
import { RootState } from "@shared/store/store";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { FiInfo, FiSave, FiX } from "react-icons/fi";
import { useSelector } from "react-redux";
import { number, object } from "yup";

interface NewChargeFormDialogProps extends DialogProps {}

interface DefaultValues {
  quantity: string;
  maxPaymentDate: Date | null;
}

const schema = object({
  quantity: number().required("Informe uma quantidade"),
});

const defaultValues = {
  quantity: "",
  maxPaymentDate: null as null | Date,
};

export const NewChargeFormDialog = ({ onClose, ...props }: NewChargeFormDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [checkboxSelection, setCheckboxSelection] = useState<number[]>([]);

  const user = useSelector<RootState, User | undefined>((state) => state.auth.user);

  useEffect(() => {
    const getData = async () => {
      const response = await getApi().get("/users");
      setUsers(response.data.users);
    };

    getData();
  }, []);

  const handleClose = () => {
    reset(defaultValues);
    if (onClose) onClose({}, "backdropClick");
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DefaultValues>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: DefaultValues) => {
    if (!user) {
      toast.error("Usuário atual não encontrado");
      return;
    }

    console.log("data: ", data);
    const toastId = toast.loading("Salvando cobrança");
    getApi()
      .post("/charges", {
        maxPaymentDate: data.maxPaymentDate,
        personsIds: checkboxSelection,
        quantity: Number(data.quantity),
        user: {
          id: user.id,
          name: user.name,
        },
      } as Charge)
      .then(() => toast.success("Cobrança criada. Pagadores serão notificados!") && handleClose())
      .catch(() => toast.error("Não foi possível salvar os dados"))
      .finally(() => toast.dismiss(toastId));
  };

  return (
    <Dialog maxWidth="lg" fullWidth onClose={handleClose} {...props}>
      <DialogTitle className="text-coffee-light-600">Nova cobrança</DialogTitle>
      <DialogContent>
        <div className="flex justify-between gap-4 flex-col sm:flex-row">
          <form id="chargeForm" onSubmit={handleSubmit(onSubmit)} className="py-2 gap-4 flex-col flex sm:pt-14">
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="0,00"
                  className="max-w-[13rem]"
                  type="number"
                  label="Quantidade*"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$ </InputAdornment>,
                  }}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message ?? ""}
                />
              )}
            />

            <div className="flex gap-2 items-center">
              <Controller
                control={control}
                name="maxPaymentDate"
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    className="max-w-[13rem]"
                    disablePast
                    slotProps={{ textField: { label: "Data máxima" } }}
                  />
                )}
              />
              <Tooltip title="Data de prazo máximo que será informado a todos caso necessário">
                <div>
                  <IconButton size="small">
                    <FiInfo />
                  </IconButton>
                </div>
              </Tooltip>
            </div>
          </form>

          <div>
            <DataGrid
              columns={[{ field: "name", maxWidth: 500, flex: 1, headerName: "Nome" }]}
              rows={users}
              rowSelectionModel={checkboxSelection}
              onRowSelectionModelChange={(newSelection) => setCheckboxSelection(newSelection as number[])}
              density="compact"
              className="mt-1"
              checkboxSelection
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              getRowId={(user) => user.id}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="outlined" type="submit" onClick={handleClose} startIcon={<FiX />}>
          Cancelar
        </Button>
        <Button
          color="primary"
          variant="contained"
          type="submit"
          form="chargeForm"
          startIcon={<FiSave />}
          disabled={!checkboxSelection.length}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
