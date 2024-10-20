import { Component } from 'react';
import {
  TextInput,
  Button,
  View,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as SQlite from 'expo-sqlite/legacy';

const db = SQlite.openDatabase('pessoas.db');

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nome: '',
      idade: '',
      pessoas: [],
      editandoId: null, 
    };
  }

  criarTabelaPessoas = () => {
    db.transaction( (tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pessoas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          idade INTEGER NOT NULL
        );`,
        [],
        () => {
          console.log('Tabela pessoas criada com sucesso.');
        },
        (_, error) => {
          console.log('Erro ao criar a tabela pessoas:', error);
          return false;
        }
      );
    });
  };

  cadastrarOuEditarPessoa = () => {
    const { nome, idade, editandoId } = this.state;

    if (nome === '' || idade === '') {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (editandoId === null) {
      // Inserção de novo registro
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO pessoas (nome, idade) values (?, ?)',
          [nome, idade],
          (_, result) => {
            Alert.alert('Sucesso', 'Pessoa cadastrada com sucesso!');
            this.setState({ nome: '', idade: '' });
            this.carregarPessoas();
          },
          (_, error) => {
            console.log('Erro ao cadastrar pessoa:', error);
            Alert.alert('Erro', 'Não foi possível cadastrar a pessoa.');
            return false;
          }
        );
      });
    } else {
      // Atualização de um registro existente
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE pessoas SET nome = ?, idade = ? WHERE id = ?',
          [nome, idade, editandoId],
          (_, result) => {
            Alert.alert('Sucesso', 'Pessoa atualizada com sucesso!');
            this.setState({ nome: '', idade: '', editandoId: null });
            this.carregarPessoas();
          },
          (_, error) => {
            console.log('Erro ao atualizar pessoa:', error);
            Alert.alert('Erro', 'Não foi possível atualizar a pessoa.');
            return false;
          }
        );
      });
    }
  };

  excluirPessoa = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM pessoas WHERE id = ?',
        [id],
        (_, result) => {
          Alert.alert('Sucesso', 'Pessoa excluída com sucesso!');
          this.carregarPessoas();
        },
        (_, error) => {
          console.log('Erro ao excluir pessoa:', error);
          Alert.alert('Erro', 'Não foi possível excluir a pessoa.');
          return false;
        }
      );
    });
  };

  carregarPessoas = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM pessoas',
        [],
        (_, { rows }) => {
          this.setState({ pessoas: rows._array });
        },
        (_, error) => {
          console.log('Erro ao carregar as pessoas:', error);
          return false;
        }
      );
    });
  };

  iniciarEdicao = (pessoa) => {
    this.setState({
      nome: pessoa.nome,
      idade: pessoa.idade.toString(),
      editandoId: pessoa.id,
    });
  };

  componentDidMount() {
    this.criarTabelaPessoas();
    this.carregarPessoas();
    
  }

  render() {
    return (
      <SafeAreaView style={css.container}>
        <View style={css.linha}>
          <Text>Nome :</Text>
          <TextInput
            style={css.input}
            value={this.state.nome}
            onChangeText={(nome) => this.setState({ nome })}
            placeholder="Digite o nome"
          />

          <Text>Idade:</Text>
          <TextInput
            style={css.input}
            keyboardType="numeric"
            value={this.state.idade}
            onChangeText={(idade) => this.setState({ idade })}
            placeholder="Digite a idade"
          />

          <Button title={'Salvar'} onPress={this.cadastrarOuEditarPessoa} />

          <Text style={css.titulo}>Pessoas Cadastradas:</Text>

          <FlatList
            data={this.state.pessoas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={css.linhaLista}>
                <View>
                  <Text>Código: {item.id}</Text>
                  <Text>Nome: {item.nome}</Text>
                  <Text>Idade: {item.idade}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={css.btnEditar}
                    onPress={() => this.iniciarEdicao(item)}>
                    <Text style={{ color: 'white' }}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={css.btnExcluir}
                    onPress={() => this.excluirPessoa(item.id)}>
                    <Text style={{ color: 'white' }}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const css = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  linha: {
    padding: 20,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 5,
    backgroundColor: '#fff',
  },
  titulo: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linhaLista: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnEditar: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  btnExcluir: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
});
